
class LucioPaivas {
    constructor () {

    }

    run() {

    }
}

class JonGallants {

    constructor () {
        this.maxValue = 1;
        this.minValue = 0.005;
        this.maxCompression = 0.25;
        this.minFlow = 0.005;
        this.maxFlow = 4;
        this.flowSpeed = 1;
    }

    calculateVerticalFlowValue(liquidMe, liquidDestination) {
        const sum = liquidMe + liquidDestination;

        if (sum <= this.maxValue) {  // if the destination can hold it all, transfer them everything I have
            return this.maxValue;
        } else if (sum < 2 * this.maxValue + this.maxCompression) {
            return (this.maxValue * this.maxValue + sum * this.maxCompression) / (this.maxValue + this.maxCompression);
        } else {
            return (sum + this.maxCompression) / 2;
        }
    }

    constrainFlow(flow, remainingAtCenter) {
        const min = 0;
        const max = Math.min(this.maxFlow, remainingAtCenter);
        return Math.max(min, Math.min(flow, max));
    }

    run() {
        let remainingValue = center.value;
        let flow;

        // bottom
        flow = this.calculateVerticalFlowValue(center.value, bottom.value) - bottom.value;
        if (bottom.value > 0 && flow > this.minFlow) {
            flow *= this.flowSpeed;
        }

        flow = this.constrainFlow(flow, remainingValue);

        if (flow > 0) {
            remainingValue -= flow;
            center.diff -= flow;
            bottom.diff += flow;
        }

        if (remainingValue < this.minValue) {
            center.diff -= remainingValue;
            return;
        }

        // left
        flow = (remainingValue - left.value) / 4;
        if (flow < this.minFlow) {
            flow *= this.flowSpeed;
        }

        flow = this.constrainFlow(flow, remainingValue);

        if (flow > 0) {
            remainingValue -= flow;
            center.diff -= flow;
            left.diff += flow;
        }

        if (remainingValue < this.minValue) {
            center.diff -= this.remainingValue;
            return;
        }

        // right
        flow = (remainingValue - right.value) / 3;
        if (flow < this.minFlow) {
            flow *= this.flowSpeed;
        }

        flow = this.constrainFlow(flow, remainingValue);

        if (flow > 0) {
            remainingValue -= flow;
            center.diff -= flow;
            right.diff += flow;
        }

        if (remainingValue < this.minValue) {
            center.diff -= remainingValue;
            return;
        }

        // top
        flow = remainingValue - this.calculateVerticalFlowValue(center.value, top.value);
        if (flow > this.minFlow) {
            flow *= this.flowSpeed;
        }

        flow = this.constrainFlow(flow, remainingValue);

        if (flow > 0) {
            remainingValue -= flow;
            center.diff -= flow;
            top.diff += flow;
        }

        if (remainingValue < this.minValue) {
            center.diff -= remainingValue;
        }
    }
}

const size = 3;
const matrix = Array.from(Array(size), () => Array.from(Array(size), () => {
    return {
        element: null,
        diffElement: null,
        value: 0,
        diff: 0
    }
}));

const center = matrix[1][1];
const top = matrix[1][0];
const right = matrix[2][1];
const bottom = matrix[1][2];
const left = matrix[0][1];

const ALGORITHM_GALLANT = 0;
const ALGORITHM_PAIVA = 1;
let selectedAlgorithm = null;

const jonGallants = new JonGallants();
const lucioPaivas = new LucioPaivas();

initialize();

// functions

function initialize() {
    center.value = 5;

    const cellTable = document.getElementById("cell-table");
    const diffTable = document.getElementById("diff-table");

    for (let y = 0; y < size; y++) {
        const cellRowElement = cellTable.insertRow();
        const diffRowElement = diffTable.insertRow();

        for (let x = 0; x < size; x++) {
            const cellObj = matrix[x][y];

            const input = document.createElement("input");
            input.setAttribute("type", "number");
            input.setAttribute("step", "1");
            input.setAttribute("min", "0");
            // corner cells are not being used, so let's disable their inputs to avoid confusion
            if (x === 0 && y === 0 || x === 2 && y === 0 || x === 2 && y === 2 || x === 0 && y === 2) {
                input.setAttribute("disabled", "");
            }

            const cellElement = cellRowElement.insertCell();
            // cellElement.setAttribute("id", colIndex + "-" + rowIndex);

            cellElement.appendChild(input);
            input.addEventListener("input", () => {
                cellObj.value = parseFloat(input.value);
                recalculate();
            });
            cellObj.element = input;
            cellObj.element.value = cellObj.value;

            const diffElement = diffRowElement.insertCell();
            cellObj.diffElement = diffElement;
            diffElement.innerHTML = "0";

            updateCellDiffElement(cellObj);
        }
    }

    const radioGallant = document.getElementById("radio-gallant");
    radioGallant.addEventListener("input", () => {
        selectedAlgorithm = ALGORITHM_GALLANT;
        recalculate();
    });
    const radioPaiva = document.getElementById("radio-paiva");
    radioPaiva.addEventListener("input", () => {
        selectedAlgorithm = ALGORITHM_PAIVA;
        recalculate();
    });
    selectedAlgorithm = radioPaiva.hasAttribute("checked") ? ALGORITHM_PAIVA : ALGORITHM_GALLANT;

    recalculate();
}

function clearDiffs() {
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = matrix[x][y];
            cell.diff = 0;
            updateCellDiffElement(cell);
        }
    }
}

function updateAllElements() {
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const cell = matrix[x][y];
            updateCellDiffElement(cell);
        }
    }
}

function updateCellDiffElement(cell) {
    const netValue = (cell === center) ? cell.value + cell.diff : cell.diff;
    const perc = center.value > 0 ? 100 * (netValue / center.value) : 0;
    cell.diffElement.innerHTML = `${netValue.toFixed(2)} <br> <span class="perc">${perc.toFixed(0)}%</span>`;
}

function recalculate() {
    clearDiffs();

    if (selectedAlgorithm === ALGORITHM_GALLANT) {
        jonGallants.run();
    } else {
        lucioPaivas.run();
    }

    updateAllElements();
}
