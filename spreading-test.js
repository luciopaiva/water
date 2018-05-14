
class LucioPaivas {
    constructor () {
        /** amount of water that a cell can hold comfortably */
        this.comfortableWeight = 1;
        /** total amount of water that can be transferred by a cell to its neighbors in a single step */
        // ToDo maybe this can be a percentage of the current amount of water the cell is holding
        this.totalMaxCurrent = 4;
        /** pressure delta when you go one cell down - helps biasing vertical flow by inducing movement down and making
         *  it hard for water to go up */
        this.pressureDelta = 2;
    }

    run() {
        if (center.value <= this.comfortableWeight) {
            // ToDo there's no "comfortable" if cell below is empty; water must flow down - do not return here
            return;
        }

        const totalMaxCurrent = Math.min(this.totalMaxCurrent, center.value);
        const potentialLeft = Math.max(0, totalMaxCurrent - left.value);
        const potentialRight = Math.max(0, totalMaxCurrent - right.value);
        const potentialDown = Math.max(0, totalMaxCurrent - down.value + this.pressureDelta);
        const potentialTop = Math.max(0, totalMaxCurrent - top.value - this.pressureDelta);
        // ToDo to remove the condition at the beginning of the method, I have to somehow make at least part of the water
        //      want to stay in the block... instead of introducing the concept of inertia, maybe I could just implement
        //      some scaling factor after calculating the current to each neighbor
        const potentialInertia = 0; // center.value - this.comfortableWeight;
        const totalPotential = potentialLeft + potentialRight + potentialDown + potentialTop + potentialInertia;
        if (totalPotential === 0) {
            return;
        }

        const conductanceFactorLeft = potentialLeft / totalPotential;
        const conductanceFactorRight = potentialRight / totalPotential;
        const conductanceFactorTop = potentialTop / totalPotential;
        const conductanceFactorDown = potentialDown / totalPotential;

        // ToDo flow more or less water according to individual potential difference, but always respecting total flow
        const currentLeft = conductanceFactorLeft * totalMaxCurrent;
        const currentRight = conductanceFactorRight * totalMaxCurrent;
        const currentTop = conductanceFactorTop * totalMaxCurrent;
        const currentDown = conductanceFactorDown * totalMaxCurrent;

        left.diff += currentLeft;
        right.diff += currentRight;
        top.diff += currentTop;
        down.diff += currentDown;
        center.diff -= totalMaxCurrent;
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
        flow = this.calculateVerticalFlowValue(center.value, down.value) - down.value;
        if (down.value > 0 && flow > this.minFlow) {
            flow *= this.flowSpeed;
        }

        flow = this.constrainFlow(flow, remainingValue);

        if (flow > 0) {
            remainingValue -= flow;
            center.diff -= flow;
            down.diff += flow;
        }

        if (remainingValue < this.minValue) {
            center.diff -= remainingValue;
            return;
        }

        // left
        flow = (remainingValue - left.value) / 4;
        if (flow > this.minFlow) {
            flow *= this.flowSpeed;
        }

        flow = this.constrainFlow(flow, remainingValue);

        if (flow > 0) {
            remainingValue -= flow;
            center.diff -= flow;
            left.diff += flow;
        }

        if (remainingValue < this.minValue) {
            center.diff -= remainingValue;
            return;
        }

        // right
        flow = (remainingValue - right.value) / 3;
        if (flow > this.minFlow) {
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
const down = matrix[1][2];
const left = matrix[0][1];

const ALGORITHM_GALLANT = 0;
const ALGORITHM_PAIVA = 1;
let selectedAlgorithm = null;

const jonGallants = new JonGallants();
const lucioPaivas = new LucioPaivas();

initialize();

// functions

function initialize() {
    center.value = 2;

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
