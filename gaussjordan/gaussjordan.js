document.addEventListener("DOMContentLoaded", init)

function init(){
    let rows =  3
    let cols =  3
    let tabular = {
        "matrix": [],
        "result": [],
        "history": []
    }
    initiateTabular(tabular, rows, cols);
    renderTabular(tabular)

    document.getElementById("rows-input").addEventListener("change", e => {
            rows = parseInt(e.target.value);
            initiateTabular(tabular, rows, cols);
            renderTabular(tabular)
        }
    );
    document.getElementById("cols-input").addEventListener("change", e => {
            cols = parseInt(e.target.value);
            initiateTabular(tabular, rows, cols);
            renderTabular(tabular)
        }
    );

    debugGetTabular = function(){
        return tabular
    }
}

const OperationType = {
    SWAP_ROWS: Symbol("swap"),
    MULTIPLY_ROW: Symbol("multiply"),
    ADD_ROWS: Symbol("add"),
    INITIALIZE: Symbol("initialize")
};
Object.freeze(OperationType);

function addHistoryEntry(tabular, operation, details){
    tabular.history.push(
        {
            "operation": operation,
            "details": details
        }
    )
}

function initiateTabular(tabular, rows, cols){
    tabular.matrix = []
    addHistoryEntry(tabular, OperationType.INITIALIZE, {"rows": rows, "cols": cols})
    for (let i = 0; i < rows; i++) {
        let row = []
        for (let j = 0; j < cols; j++) {
            row.push((i+1)*(j+1))
        }
        tabular.matrix.push(row)
    }
}

function swapRows(tabular, r1, r2){
    let temp = tabular.matrix[r1]
    tabular.matrix[r1] = tabular.matrix[r2]
    tabular.matrix[r2] = temp
    addHistoryEntry(tabular, OperationType.SWAP_ROWS, {"r1": r1, "r2": r2})
}

function renderTabular(tabular){
    let container = document.getElementById("tabular-container")
    container.innerHTML = ""
    let template = document.getElementById("tabular-cell")
    let table = document.createElement("table")
    table.classList.add("tabular-table")

    tabular.matrix.forEach((row, r) => {
        let tr = document.createElement("tr")
        tr.dataset.rowIndex = r

        let dropIndicator = document.createElement("div");
        dropIndicator.className = "drop-indicator";
        tr.appendChild(dropIndicator);

        // Add drag handle cell
        let handleCell = document.createElement("td")
        let handle = document.createElement("span")
        handle.className = "drag-handle"
        handle.innerHTML = "⋮⋮" // Unicode vertical dots as handle icon
        handle.addEventListener('mousedown', () => {
            tr.draggable = true
        })
        handleCell.appendChild(handle)
        tr.appendChild(handleCell)

        // Make only the handle draggable, not the whole row
        tr.draggable = false

        tr.addEventListener('dragstart', handleDragStart)
        tr.addEventListener('dragend', handleDragEnd)
        tr.addEventListener('dragover', handleDragOver)
        tr.addEventListener('drop', handleDrop)
        tr.addEventListener('dragenter', handleDragEnter)
        tr.addEventListener('dragleave', handleDragLeave)

        row.forEach((cell, c) => {
            let cellElem = template.content.cloneNode(true);
            let subcellElems = cellElem.querySelectorAll("*");
            subcellElems.forEach(node => {
                switch (node.tagName.toUpperCase()) {
                    case "INPUT":
                        node.id += "r" + r + "c" + c;
                        node.value = cell;
                        break;
                    case "LABEL":
                        node.htmlFor += "r" + r + "c" + c;
                        break;
                }
            });
            tr.appendChild(cellElem);
        });
        table.appendChild(tr);
    });

    // Add result column
    let resultTemplate = document.getElementById("tabular-result-cell");
    tabular.matrix.forEach((_, r) => {
        let cellElem = resultTemplate.content.cloneNode(true);
        let subcellElems = cellElem.querySelectorAll("*");

        subcellElems.forEach(node => {
            switch (node.tagName.toUpperCase()) {
                case "INPUT":
                    node.id += "r" + r + "result";
                    node.value = tabular.result[r] || 0;
                    node.classList.add("result-cell");
                    break;
                case "LABEL":
                    node.htmlFor += "r" + r + "result";
                    break;
            }
        });

        table.rows[r].appendChild(cellElem);
    });
    container.appendChild(table);
}

// Drag and drop handlers
let draggedRow = null;
let draggedRowIndex = null;
let lastIndicator = null;

function updateDropIndicator(row, clientY) {
    if (!row || row === draggedRow) return;

    // Remove indicator from last position
    if (lastIndicator) {
        lastIndicator.classList.remove('active');
    }

    const rect = row.getBoundingClientRect();
    const middle = rect.top + rect.height / 2;
    const indicator = row.querySelector('.drop-indicator');

    if (indicator) {
        indicator.classList.remove('drop-before', 'drop-after');
        if (clientY < middle) {
            indicator.classList.add('drop-before');
        } else {
            indicator.classList.add('drop-after');
        }
        indicator.classList.add('active');
        lastIndicator = indicator;
    }
}

function handleDragStart(e) {
    draggedRow = this;
    draggedRowIndex = parseInt(this.dataset.rowIndex);
    this.classList.add('dragging');

    // Hide the indicator of the dragged row
    const indicator = this.querySelector('.drop-indicator');
    if (indicator) {
        indicator.classList.remove('active');
    }
}

function handleDragEnd(e) {
    if (draggedRow) {
        draggedRow.classList.remove('dragging');
        draggedRow.draggable = false;
        draggedRow = null;
        draggedRowIndex = null;
    }

    // Clear all indicators
    if (lastIndicator) {
        lastIndicator.classList.remove('active');
        lastIndicator = null;
    }
}

function handleDragOver(e) {
    if (!draggedRow) return;
    e.preventDefault();
    e.stopPropagation();
    updateDropIndicator(this, e.clientY);
}

function handleDragEnter(e) {
    if (!draggedRow) return;
    e.preventDefault();
    e.stopPropagation();
    updateDropIndicator(this, e.clientY);
}

function handleDragLeave(e) {
    if (!draggedRow) return;
    const relatedTarget = e.relatedTarget;
    // Only remove indicator if we're not entering a child element
    if (!this.contains(relatedTarget)) {
        const indicator = this.querySelector('.drop-indicator');
        if (indicator) {
            indicator.classList.remove('active');
        }
        if (lastIndicator === indicator) {
            lastIndicator = null;
        }
    }
}

function handleDrop(e) {
    if (!draggedRow) return;
    e.preventDefault();
    e.stopPropagation();

    if (this !== draggedRow) {
        const targetIndex = parseInt(this.dataset.rowIndex);
        const rect = this.getBoundingClientRect();
        const insertBefore = e.clientY < (rect.top + rect.height / 2);

        const tabular = debugGetTabular();
        const matrix = tabular.matrix;

        // Calculate the actual target index
        let newIndex = insertBefore ? targetIndex : targetIndex + 1;
        if (draggedRowIndex < targetIndex) {
            newIndex--;
        }

        // Move the row
        const [movedRow] = matrix.splice(draggedRowIndex, 1);
        matrix.splice(newIndex, 0, movedRow);

        // Add history entry
        addHistoryEntry(tabular, OperationType.SWAP_ROWS, {
            "source": draggedRowIndex,
            "target": newIndex,
            "insertBefore": insertBefore
        });

        renderTabular(tabular);
    }

    handleDragEnd(e);
}
