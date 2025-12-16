document.addEventListener("DOMContentLoaded", init)


function init(){
    let tabular = {
        "matrix": [],
        "result": [],
        "history": []
    }
    initiateTabular(tabular, 3, 3)
    renderTabular(tabular)
}

function initiateTabular(tabular, rows, cols){
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
    tabular.history.push(
        {
            "operation": "swap",
            "rows": [r1, r2]
        }
    )
}

function renderTabular(tabular){
    let container = document.getElementById("tabular-container")
    let template = document.getElementById("tabular-cell")
    let table = document.createElement("table")
    table.classList.add("tabular-table")

    tabular.matrix.forEach((row, r) => {
        let tr = document.createElement("tr")
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
    //Result Column
    tabular.matrix.forEach((_, r) => {
        let cellElem = template.content.cloneNode(true);
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