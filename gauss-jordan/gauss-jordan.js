// Gauss-Jordan Calculator - Core Logic

// ==================== Fraction Class ====================
class Fraction {
  constructor(numerator, denominator = 1) {
    if (denominator === 0) {
      throw new Error('Division durch Null');
    }
    
    // Handle negative denominators
    if (denominator < 0) {
      numerator = -numerator;
      denominator = -denominator;
    }
    
    const gcd = this.gcd(Math.abs(numerator), Math.abs(denominator));
    this.num = numerator / gcd;
    this.den = denominator / gcd;
  }
  
  gcd(a, b) {
    // Iterative GCD to avoid stack overflow
    while (b !== 0) {
      [a, b] = [b, a % b];
    }
    return a;
  }
  
  add(other) {
    return new Fraction(
      this.num * other.den + other.num * this.den,
      this.den * other.den
    );
  }
  
  subtract(other) {
    return new Fraction(
      this.num * other.den - other.num * this.den,
      this.den * other.den
    );
  }
  
  multiply(other) {
    return new Fraction(this.num * other.num, this.den * other.den);
  }
  
  divide(other) {
    if (other.num === 0) {
      throw new Error('Division durch Null');
    }
    return new Fraction(this.num * other.den, this.den * other.num);
  }
  
  negate() {
    return new Fraction(-this.num, this.den);
  }
  
  isZero() {
    return this.num === 0;
  }
  
  toDecimal() {
    return this.num / this.den;
  }
  
  toString() {
    if (this.den === 1) return this.num.toString();
    return `${this.num}/${this.den}`;
  }
  
  static fromString(str) {
    str = str.trim();
    if (str.includes('/')) {
      const [num, den] = str.split('/').map(s => parseFloat(s.trim()));
      return new Fraction(num, den);
    }
    
    // Handle decimals
    const num = parseFloat(str);
    if (isNaN(num)) {
      throw new Error('Ungültige Zahl');
    }
    
    // Convert decimal to fraction using string parsing to avoid floating point errors
    const decimalPlaces = (str.split('.')[1] || '').length;
    if (decimalPlaces > 0) {
      const multiplier = Math.pow(10, decimalPlaces);
      // Use string manipulation to avoid floating point precision issues
      const numeratorStr = str.replace('.', '');
      const numerator = parseInt(numeratorStr, 10);
      return new Fraction(numerator, multiplier);
    }
    
    return new Fraction(num, 1);
  }
}

// ==================== Matrix Class ====================
class Matrix {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.data = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => new Fraction(0))
    );
  }
  
  clone() {
    const m = new Matrix(this.rows, this.cols);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        m.data[i][j] = new Fraction(this.data[i][j].num, this.data[i][j].den);
      }
    }
    return m;
  }
  
  setValue(row, col, value) {
    if (typeof value === 'string') {
      this.data[row][col] = Fraction.fromString(value);
    } else if (value instanceof Fraction) {
      this.data[row][col] = value;
    } else {
      this.data[row][col] = new Fraction(value);
    }
  }
  
  getValue(row, col) {
    return this.data[row][col];
  }
  
  swapRows(row1, row2) {
    [this.data[row1], this.data[row2]] = [this.data[row2], this.data[row1]];
  }
  
  multiplyRow(row, scalar) {
    if (!(scalar instanceof Fraction)) {
      scalar = new Fraction(scalar);
    }
    if (scalar.isZero()) {
      throw new Error('Kann Zeile nicht mit 0 multiplizieren');
    }
    for (let j = 0; j < this.cols; j++) {
      this.data[row][j] = this.data[row][j].multiply(scalar);
    }
  }
  
  addRowMultiple(targetRow, sourceRow, scalar) {
    if (!(scalar instanceof Fraction)) {
      scalar = new Fraction(scalar);
    }
    for (let j = 0; j < this.cols; j++) {
      const term = this.data[sourceRow][j].multiply(scalar);
      this.data[targetRow][j] = this.data[targetRow][j].add(term);
    }
  }
  
  toArray() {
    return this.data.map(row => row.map(val => val.toString()));
  }
}

// ==================== Roman Numerals ====================
function toRoman(num) {
  const romanNumerals = [
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
  ];
  let result = '';
  for (const [roman, value] of romanNumerals) {
    while (num >= value) {
      result += roman;
      num -= value;
    }
  }
  return result;
}

function fromRoman(str) {
  const romanValues = { I: 1, V: 5, X: 10 };
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const current = romanValues[str[i]];
    const next = romanValues[str[i + 1]];
    if (next && current < next) {
      result -= current;
    } else {
      result += current;
    }
  }
  return result;
}

// ==================== Calculator State ====================
class GaussJordanCalculator {
  constructor() {
    this.matrix = null;
    this.history = [];
    this.historyIndex = -1;
    this.autoSolveMode = false;
    this.autoSolvePaused = false;
    this.autoSolveSteps = [];
    this.autoSolveIndex = 0;
    this.init();
  }
  
  init() {
    this.createMatrix(3, 4);
    this.setupEventListeners();
    this.updateDisplay();
    this.setupKeyboardShortcuts();
  }
  
  createMatrix(rows, cols) {
    this.matrix = new Matrix(rows, cols);
    this.saveState('Matrix erstellt');
    this.renderMatrix();
    this.updateHistoryDisplay();
  }
  
  saveState(description) {
    // Remove any states after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add new state
    this.history.push({
      matrix: this.matrix.clone(),
      description: description,
      timestamp: new Date()
    });
    
    this.historyIndex = this.history.length - 1;
    this.updateUndoRedoButtons();
    this.updateHistoryDisplay();
  }
  
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.matrix = this.history[this.historyIndex].matrix.clone();
      this.renderMatrix();
      this.updateUndoRedoButtons();
      this.showFeedback('Rückgängig gemacht', 'info');
    }
  }
  
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.matrix = this.history[this.historyIndex].matrix.clone();
      this.renderMatrix();
      this.updateUndoRedoButtons();
      this.showFeedback('Wiederhergestellt', 'info');
    }
  }
  
  renderMatrix() {
    const container = document.getElementById('matrix-container');
    const table = document.createElement('table');
    table.className = 'matrix-table';
    
    for (let i = 0; i < this.matrix.rows; i++) {
      const row = document.createElement('tr');
      row.draggable = true;
      row.dataset.rowIndex = i;
      
      // Add drag event listeners
      row.addEventListener('dragstart', this.handleDragStart.bind(this));
      row.addEventListener('dragover', this.handleDragOver.bind(this));
      row.addEventListener('drop', this.handleDrop.bind(this));
      row.addEventListener('dragend', this.handleDragEnd.bind(this));
      
      // Row label
      const labelCell = document.createElement('td');
      labelCell.className = 'row-label';
      labelCell.textContent = toRoman(i + 1);
      row.appendChild(labelCell);
      
      // Data cells
      for (let j = 0; j < this.matrix.cols; j++) {
        const cell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.matrix.getValue(i, j).toString();
        input.dataset.row = i;
        input.dataset.col = j;
        
        input.addEventListener('change', (e) => {
          try {
            this.matrix.setValue(i, j, e.target.value);
            this.saveState(`Wert geändert bei (${toRoman(i + 1)}, ${j + 1})`);
            this.checkSolution();
          } catch (error) {
            this.showFeedback(`Fehler: ${error.message}`, 'error');
            input.value = this.matrix.getValue(i, j).toString();
          }
        });
        
        cell.appendChild(input);
        row.appendChild(cell);
      }
      
      table.appendChild(row);
    }
    
    container.innerHTML = '';
    container.appendChild(table);
  }
  
  handleDragStart(e) {
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.currentTarget.dataset.rowIndex);
  }
  
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dragging = document.querySelector('.dragging');
    const target = e.currentTarget;
    if (dragging !== target) {
      target.classList.add('drag-over');
    }
  }
  
  handleDrop(e) {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const targetIndex = parseInt(e.currentTarget.dataset.rowIndex);
    
    if (sourceIndex !== targetIndex) {
      this.matrix.swapRows(sourceIndex, targetIndex);
      this.saveState(`Zeilen ${toRoman(sourceIndex + 1)} und ${toRoman(targetIndex + 1)} getauscht`);
      this.renderMatrix();
      this.checkSolution();
    }
  }
  
  handleDragEnd(e) {
    document.querySelectorAll('.matrix-table tr').forEach(row => {
      row.classList.remove('dragging', 'drag-over');
    });
  }
  
  parseOperation(operationStr) {
    // Remove all spaces
    operationStr = operationStr.replace(/\s+/g, '');
    
    // Parse: TARGET = SOURCE_EXPRESSION
    const parts = operationStr.split('=');
    if (parts.length !== 2) {
      throw new Error('Ungültige Syntax. Format: I = I + 3*II');
    }
    
    const targetStr = parts[0].trim();
    const expressionStr = parts[1].trim();
    
    // Parse target row
    const targetRow = fromRoman(targetStr) - 1;
    if (targetRow < 0 || targetRow >= this.matrix.rows) {
      throw new Error('Ungültige Zielzeile');
    }
    
    // Parse expression
    return this.parseExpression(expressionStr, targetRow);
  }
  
  parseExpression(expr, targetRow) {
    const operations = [];
    
    // Match patterns like: 3*II, -IV/6, I, +2*III
    // Capture groups: (1) sign, (2) coefficient, (3) mult symbol, (4) Roman numeral
    const termRegex = /([+-]?)(\d+\/\d+|\d*\.?\d+)?(\*?)([IVX]+)/g;
    let match;
    
    while ((match = termRegex.exec(expr)) !== null) {
      const sign = match[1] === '-' ? -1 : 1;
      const coefficient = match[2] ? Fraction.fromString(match[2]) : new Fraction(1);
      const rowStr = match[4];
      const rowIndex = fromRoman(rowStr) - 1;
      
      if (rowIndex < 0 || rowIndex >= this.matrix.rows) {
        throw new Error(`Ungültige Zeile: ${rowStr}`);
      }
      
      const finalCoeff = coefficient.multiply(new Fraction(sign));
      operations.push({ rowIndex, coefficient: finalCoeff });
    }
    
    if (operations.length === 0) {
      throw new Error('Keine gültige Operation gefunden');
    }
    
    return { targetRow, operations };
  }
  
  applyOperation(operationStr) {
    try {
      const { targetRow, operations } = this.parseOperation(operationStr);
      
      // Create a temporary result row
      const result = Array.from({length: this.matrix.cols}, () => new Fraction(0));
      
      // Sum all operations
      for (const op of operations) {
        for (let j = 0; j < this.matrix.cols; j++) {
          const term = this.matrix.getValue(op.rowIndex, j).multiply(op.coefficient);
          result[j] = result[j].add(term);
        }
      }
      
      // Apply result to target row
      for (let j = 0; j < this.matrix.cols; j++) {
        this.matrix.setValue(targetRow, j, result[j]);
      }
      
      this.saveState(`Operation: ${operationStr}`);
      this.renderMatrix();
      this.highlightChangedRow(targetRow);
      this.checkSolution();
      this.showFeedback(`Operation erfolgreich angewendet: ${operationStr}`, 'success');
    } catch (error) {
      this.showFeedback(`Fehler: ${error.message}`, 'error');
    }
  }
  
  highlightChangedRow(rowIndex) {
    const rows = document.querySelectorAll('.matrix-table tr');
    if (rows[rowIndex]) {
      rows[rowIndex].classList.add('active-row');
      const inputs = rows[rowIndex].querySelectorAll('input');
      inputs.forEach(input => {
        input.classList.add('changed-value');
        setTimeout(() => input.classList.remove('changed-value'), 1000);
      });
      setTimeout(() => rows[rowIndex].classList.remove('active-row'), 2000);
    }
  }
  
  // Auto-solve methods
  generateSolutionSteps() {
    const steps = [];
    const m = this.matrix.clone();
    
    // Forward elimination
    for (let col = 0; col < Math.min(m.rows, m.cols - 1); col++) {
      // Find pivot
      let pivotRow = col;
      for (let row = col + 1; row < m.rows; row++) {
        if (Math.abs(m.getValue(row, col).toDecimal()) > 
            Math.abs(m.getValue(pivotRow, col).toDecimal())) {
          pivotRow = row;
        }
      }
      
      // Swap if needed
      if (pivotRow !== col) {
        m.swapRows(col, pivotRow);
        steps.push({
          type: 'swap',
          row1: col,
          row2: pivotRow,
          description: `Tausche ${toRoman(col + 1)} ↔ ${toRoman(pivotRow + 1)}`
        });
      }
      
      const pivotValue = m.getValue(col, col);
      
      // Check for zero pivot
      if (pivotValue.isZero()) {
        steps.push({
          type: 'info',
          description: `Pivot-Element ist 0 in Spalte ${col + 1} - mögliche Sonderfälle`
        });
        continue;
      }
      
      // Normalize pivot row
      if (pivotValue.num !== pivotValue.den) {
        const normalizer = new Fraction(pivotValue.den, pivotValue.num);
        m.multiplyRow(col, normalizer);
        steps.push({
          type: 'multiply',
          row: col,
          scalar: normalizer,
          description: `${toRoman(col + 1)} = ${normalizer.toString()}*${toRoman(col + 1)}`
        });
      }
      
      // Eliminate column
      for (let row = 0; row < m.rows; row++) {
        if (row === col) continue;
        
        const factor = m.getValue(row, col);
        if (!factor.isZero()) {
          m.addRowMultiple(row, col, factor.negate());
          steps.push({
            type: 'add',
            targetRow: row,
            sourceRow: col,
            scalar: factor.negate(),
            description: `${toRoman(row + 1)} = ${toRoman(row + 1)} + (${factor.negate().toString()})*${toRoman(col + 1)}`
          });
        }
      }
    }
    
    return { steps, finalMatrix: m };
  }
  
  startAutoSolve() {
    const { steps, finalMatrix } = this.generateSolutionSteps();
    this.autoSolveSteps = steps;
    this.autoSolveIndex = 0;
    this.autoSolveMode = true;
    this.autoSolvePaused = false;
    
    document.getElementById('next-step-btn').disabled = false;
    document.getElementById('pause-btn').disabled = false;
    
    this.showFeedback(`Auto-Modus gestartet: ${steps.length} Schritte gefunden`, 'info');
  }
  
  nextAutoStep() {
    if (this.autoSolveIndex >= this.autoSolveSteps.length) {
      this.showFeedback('Alle Schritte abgeschlossen', 'success');
      this.autoSolveMode = false;
      document.getElementById('next-step-btn').disabled = true;
      document.getElementById('pause-btn').disabled = true;
      this.checkSolution();
      return;
    }
    
    const step = this.autoSolveSteps[this.autoSolveIndex];
    
    switch (step.type) {
      case 'swap':
        this.matrix.swapRows(step.row1, step.row2);
        break;
      case 'multiply':
        this.matrix.multiplyRow(step.row, step.scalar);
        break;
      case 'add':
        this.matrix.addRowMultiple(step.targetRow, step.sourceRow, step.scalar);
        break;
      case 'info':
        this.showFeedback(step.description, 'info');
        this.autoSolveIndex++;
        return this.nextAutoStep();
    }
    
    this.saveState(step.description);
    this.renderMatrix();
    this.showFeedback(`Schritt ${this.autoSolveIndex + 1}/${this.autoSolveSteps.length}: ${step.description}`, 'info');
    this.autoSolveIndex++;
  }
  
  solveAll() {
    const { steps } = this.generateSolutionSteps();
    
    for (const step of steps) {
      if (step.type === 'info') continue;
      
      switch (step.type) {
        case 'swap':
          this.matrix.swapRows(step.row1, step.row2);
          break;
        case 'multiply':
          this.matrix.multiplyRow(step.row, step.scalar);
          break;
        case 'add':
          this.matrix.addRowMultiple(step.targetRow, step.sourceRow, step.scalar);
          break;
      }
    }
    
    this.saveState('Komplett gelöst');
    this.renderMatrix();
    this.checkSolution();
    this.showFeedback('Matrix vollständig gelöst', 'success');
  }
  
  checkSolution() {
    // Analyze current matrix state
    const solutionDiv = document.getElementById('solution-display');
    
    // Check if in reduced row echelon form
    let isRREF = true;
    let leadingOnes = [];
    
    for (let i = 0; i < this.matrix.rows; i++) {
      let leadingCol = -1;
      for (let j = 0; j < this.matrix.cols - 1; j++) {
        const val = this.matrix.getValue(i, j);
        if (!val.isZero()) {
          leadingCol = j;
          if (val.num !== val.den) isRREF = false;
          break;
        }
      }
      if (leadingCol >= 0) {
        leadingOnes.push({ row: i, col: leadingCol });
      }
    }
    
    // Check for inconsistency (0 = non-zero)
    let hasInconsistency = false;
    for (let i = 0; i < this.matrix.rows; i++) {
      let allZero = true;
      for (let j = 0; j < this.matrix.cols - 1; j++) {
        if (!this.matrix.getValue(i, j).isZero()) {
          allZero = false;
          break;
        }
      }
      if (allZero && !this.matrix.getValue(i, this.matrix.cols - 1).isZero()) {
        hasInconsistency = true;
        break;
      }
    }
    
    let html = '<div class="solution-header">Analyse:</div>';
    
    if (hasInconsistency) {
      html += '<div class="no-solution">⚠️ Keine Lösung (inkonsistentes System)</div>';
    } else if (isRREF && leadingOnes.length === this.matrix.cols - 1) {
      html += '<div class="solution-header">✓ Eindeutige Lösung:</div>';
      html += '<div class="solution-vector">';
      for (let i = 0; i < leadingOnes.length; i++) {
        const val = this.matrix.getValue(i, this.matrix.cols - 1);
        html += `x<sub>${i + 1}</sub> = ${val.toString()}<br>`;
      }
      html += '</div>';
    } else if (isRREF && leadingOnes.length < this.matrix.cols - 1) {
      html += '<div class="infinite-solutions">∞ Unendlich viele Lösungen (Freiheitsgrade)</div>';
      
      // Determine which variables are free
      const numVariables = this.matrix.cols - 1;
      const leadingCols = leadingOnes.map(lo => lo.col);
      const freeVars = [];
      const dependentVars = [];
      
      for (let j = 0; j < numVariables; j++) {
        if (leadingCols.includes(j)) {
          dependentVars.push(j);
        } else {
          freeVars.push(j);
        }
      }
      
      // Display free variables
      if (freeVars.length > 0) {
        html += '<div class="solution-conditions">';
        html += '<p><strong>Freie Variablen:</strong> ';
        html += freeVars.map(idx => `x<sub>${idx + 1}</sub>`).join(', ');
        html += '</p>';
        
        // Display parametric solution
        html += '<p><strong>Ergebnisbedingungen:</strong></p>';
        html += '<div class="solution-vector">';
        
        for (let i = 0; i < leadingOnes.length; i++) {
          const leadingOne = leadingOnes[i];
          const row = leadingOne.row;
          const col = leadingOne.col;
          
          // Build the equation for this variable
          let equation = `x<sub>${col + 1}</sub> = `;
          const constantTerm = this.matrix.getValue(row, this.matrix.cols - 1);
          
          // Collect terms for free variables
          let terms = [];
          
          // Add constant term
          if (!constantTerm.isZero()) {
            terms.push(constantTerm.toString());
          }
          
          // Add terms for free variables
          for (let j = 0; j < numVariables; j++) {
            if (freeVars.includes(j)) {
              const coeff = this.matrix.getValue(row, j);
              if (!coeff.isZero()) {
                const coeffNeg = coeff.negate();
                if (coeffNeg.num === coeffNeg.den) {
                  // Coefficient is 1
                  terms.push(`+ x<sub>${j + 1}</sub>`);
                } else if (coeffNeg.num === -coeffNeg.den) {
                  // Coefficient is -1
                  terms.push(`- x<sub>${j + 1}</sub>`);
                } else {
                  // General coefficient
                  if (coeffNeg.num >= 0) {
                    terms.push(`+ ${coeffNeg.toString()}·x<sub>${j + 1}</sub>`);
                  } else {
                    terms.push(`- ${coeffNeg.negate().toString()}·x<sub>${j + 1}</sub>`);
                  }
                }
              }
            }
          }
          
          if (terms.length === 0) {
            equation += '0';
          } else {
            // Join terms with space and clean up formatting
            equation = equation + terms.join(' ');
            // Remove leading + sign if constant term is 0
            equation = equation.replace(/= \+ /g, '= ');
          }
          
          html += equation + '<br>';
        }
        
        // Show free variables can take any value
        for (const freeIdx of freeVars) {
          html += `x<sub>${freeIdx + 1}</sub> ∈ ℝ (beliebig)<br>`;
        }
        
        html += '</div>';
        html += '</div>';
      } else {
        html += '<p>Das System hat freie Variablen.</p>';
      }
    } else {
      html += '<p>Matrix ist noch nicht in reduzierter Zeilenstufenform.</p>';
      html += '<p>Verwenden Sie den Auto-Modus oder führen Sie weitere Operationen durch.</p>';
    }
    
    solutionDiv.innerHTML = html;
  }
  
  copyMatrix() {
    const text = this.matrix.toArray().map(row => row.join('\t')).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.showFeedback('Matrix in Zwischenablage kopiert', 'success');
    }).catch(() => {
      this.showFeedback('Kopieren fehlgeschlagen', 'error');
    });
  }
  
  pasteMatrix() {
    navigator.clipboard.readText().then(text => {
      try {
        const rows = text.trim().split('\n');
        const data = rows.map(row => row.split(/[\t,;]/).map(s => s.trim()));
        
        const newRows = data.length;
        const newCols = data[0].length;
        
        this.matrix = new Matrix(newRows, newCols);
        for (let i = 0; i < newRows; i++) {
          for (let j = 0; j < newCols; j++) {
            if (data[i][j]) {
              this.matrix.setValue(i, j, data[i][j]);
            }
          }
        }
        
        this.saveState('Matrix eingefügt');
        this.renderMatrix();
        this.showFeedback('Matrix erfolgreich eingefügt', 'success');
      } catch (error) {
        this.showFeedback(`Fehler beim Einfügen: ${error.message}`, 'error');
      }
    });
  }
  
  exportText() {
    const text = this.matrix.toArray().map((row, i) => 
      `${toRoman(i + 1)}: [${row.join(', ')}]`
    ).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gauss-jordan-matrix.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    this.showFeedback('Matrix als Text exportiert', 'success');
  }
  
  showFeedback(message, type) {
    const feedback = document.getElementById('operation-feedback');
    feedback.textContent = message;
    feedback.className = `operation-feedback ${type}`;
    
    if (type !== 'error') {
      setTimeout(() => {
        feedback.textContent = '';
        feedback.className = 'operation-feedback';
      }, 5000);
    }
  }
  
  updateUndoRedoButtons() {
    document.getElementById('undo-btn').disabled = this.historyIndex <= 0;
    document.getElementById('redo-btn').disabled = this.historyIndex >= this.history.length - 1;
  }
  
  updateHistoryDisplay() {
    const display = document.getElementById('history-display');
    const recentHistory = this.history.slice(-10).reverse();
    
    display.innerHTML = recentHistory.map((state, idx) => {
      const isCurrent = (this.history.length - 1 - idx) === this.historyIndex;
      return `<div class="history-item ${isCurrent ? 'current' : ''}">
        ${isCurrent ? '→ ' : '  '}${state.description}
      </div>`;
    }).join('');
  }
  
  updateDisplay() {
    this.updateUndoRedoButtons();
    this.checkSolution();
  }
  
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
      }
    });
  }
  
  setupEventListeners() {
    // Matrix creation
    document.getElementById('create-matrix-btn').addEventListener('click', () => {
      const rows = parseInt(document.getElementById('rows-input').value);
      const cols = parseInt(document.getElementById('cols-input').value);
      if (rows > 0 && cols > 0) {
        this.createMatrix(rows, cols);
      }
    });
    
    document.getElementById('clear-matrix-btn').addEventListener('click', () => {
      const rows = this.matrix.rows;
      const cols = this.matrix.cols;
      this.createMatrix(rows, cols);
      this.showFeedback('Matrix zurückgesetzt', 'info');
    });
    
    // Operations
    const operationInput = document.getElementById('operation-input');
    document.getElementById('apply-operation-btn').addEventListener('click', () => {
      this.applyOperation(operationInput.value);
      operationInput.value = '';
    });
    
    operationInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.applyOperation(operationInput.value);
        operationInput.value = '';
      }
    });
    
    // Auto-solve
    document.getElementById('auto-solve-btn').addEventListener('click', () => {
      this.startAutoSolve();
    });
    
    document.getElementById('next-step-btn').addEventListener('click', () => {
      this.nextAutoStep();
    });
    
    document.getElementById('solve-all-btn').addEventListener('click', () => {
      this.solveAll();
    });
    
    // History
    document.getElementById('undo-btn').addEventListener('click', () => this.undo());
    document.getElementById('redo-btn').addEventListener('click', () => this.redo());
    document.getElementById('clear-history-btn').addEventListener('click', () => {
      this.history = [this.history[this.historyIndex]];
      this.historyIndex = 0;
      this.updateHistoryDisplay();
      this.showFeedback('Historie gelöscht', 'info');
    });
    
    // Import/Export
    document.getElementById('copy-matrix-btn').addEventListener('click', () => this.copyMatrix());
    document.getElementById('paste-matrix-btn').addEventListener('click', () => this.pasteMatrix());
    document.getElementById('export-text-btn').addEventListener('click', () => this.exportText());
  }
}

// Initialize calculator when page loads
let calculator;
document.addEventListener('DOMContentLoaded', () => {
  calculator = new GaussJordanCalculator();
});
