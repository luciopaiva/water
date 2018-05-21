
class LucioPaivas {
    constructor () {
        /** amount of water that a cell can hold comfortably */
        this.comfortableWeight = 1;
        /** total amount of water that can be transferred by a cell to its neighbors in a single step */
        // ToDo maybe this can be a percentage of the current amount of water the cell is holding
        this.totalMaxCurrent = 4;
        /** percentage of water that is allowed to flow outwards in a single step */
        this.currentCoefficient = 0.8;
        /** pressure delta when you go one cell down - helps biasing vertical flow by inducing movement down and making
         *  it hard for water to go up */
        this.pressureDelta = 10;

        this.pressureCoefficient = 10;
    }

    run() {
        // if (center.value <= this.comfortableWeight) {
        //     // ToDo there's no "comfortable" if cell below is empty; water must flow down - do not return here
        //     return;
        // }

        const totalMaxCurrent = this.currentCoefficient * center.value;  // Math.min(this.totalMaxCurrent, center.value);
        // const potentialDown = Math.max(0, totalMaxCurrent - down.value + this.pressureDelta);
        // const potentialTop = Math.max(0, totalMaxCurrent - top.value - this.pressureDelta);

        // current will be proportional to the square of the water level difference between us and each neighbor
        const potentialTop = Math.max(0, totalMaxCurrent - top.value);
        const potentialLeft = Math.max(0, totalMaxCurrent - left.value);
        const potentialRight = Math.max(0, totalMaxCurrent - right.value);
        const potentialDown = Math.max(0, totalMaxCurrent - down.value);

        const totalPotential = potentialTop +
            potentialLeft * 10 +
            potentialRight * 10 +
            potentialDown * 200;
        if (totalPotential === 0) {
            return;
        }

        const conductanceFactorTop = potentialTop / totalPotential;
        const conductanceFactorLeft = 10 * potentialLeft / totalPotential;
        const conductanceFactorRight = 10 * potentialRight / totalPotential;
        const conductanceFactorDown = 200 * potentialDown / totalPotential;

        // sum should be 1
        console.info(conductanceFactorTop + conductanceFactorLeft + conductanceFactorRight + conductanceFactorDown);

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

class AlgoInfo {
    constructor (index, instance, table) {
        this.index = index;
        this.instance = instance;
        this.table = table;
    }
    run() {
        this.instance.run();
    }
}

const size = 3;
const matrix = Array.from(Array(size), () => Array.from(Array(size), () => {
    return {
        element: null,
        diffElementByAlgorithmIndex: [],
        value: 0,
        diff: 0
    }
}));

const center = matrix[1][1];
const top = matrix[1][0];
const right = matrix[2][1];
const down = matrix[1][2];
const left = matrix[0][1];

const ALGORITHMS = [
    new AlgoInfo(0, new JonGallants(), document.getElementById("diff-table-gallant")),
    new AlgoInfo(1, new LucioPaivas(), document.getElementById("diff-table-paiva"))
];

initialize();

// functions

function initialize() {
    center.value = 2;

    const cellTable = document.getElementById("cell-table");

    // create input table
    for (let y = 0; y < size; y++) {
        const cellRowElement = cellTable.insertRow();

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

            cellElement.appendChild(input);
            input.addEventListener("input", () => {
                cellObj.value = parseFloat(input.value);
                recalculate();
            });
            cellObj.element = input;
            cellObj.element.value = cellObj.value;
        }
    }

    // create output tables
    ALGORITHMS.forEach(algo => {
        for (let y = 0; y < size; y++) {

            const diffRowElement = algo.table.insertRow();

            for (let x = 0; x < size; x++) {
                const cellObj = matrix[x][y];

                let diffElement = diffRowElement.insertCell();
                cellObj.diffElementByAlgorithmIndex[algo.index] = diffElement;
                diffElement.innerHTML = "0";
                updateCellDiffElement(cellObj, algo.index);
            }
        }
    });

    recalculate();
}

function clearDiffsForAlgorithm(algorithmIndex) {
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const cell = matrix[x][y];
            cell.diff = 0;
            updateCellDiffElement(cell, algorithmIndex);
        }
    }
}

function updateDiffElementsForAlgorithm(algorithmIndex) {
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const cell = matrix[x][y];
            updateCellDiffElement(cell, algorithmIndex);
        }
    }
}

function updateCellDiffElement(cell, algorithmIndex) {
    const netValue = (cell === center) ? cell.value + cell.diff : cell.diff;
    const perc = center.value > 0 ? 100 * (netValue / center.value) : 0;
    cell.diffElementByAlgorithmIndex[algorithmIndex].innerHTML =
        `${netValue.toFixed(2)} <br> <span class="perc">${perc.toFixed(0)}%</span>`;
}

function recalculate() {
    ALGORITHMS.forEach(algo => {
        clearDiffsForAlgorithm(algo.index);
        algo.run();
        updateDiffElementsForAlgorithm(algo.index);
    });
}
