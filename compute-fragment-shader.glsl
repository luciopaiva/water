
uniform sampler2D sampleTexture;
uniform float cellSize;
varying vec2 uvCoords;

const vec4 UNITY = vec4(1.0);
const float MIN_WATER_LEVEL = 0.01;  // minimum level of water before remaining water evaporates and is lost
const float MAX_WATER_LEVEL = 64.0;  // maximum water that a single cell can hold
const float MIN_BLUE = 0.4;  // this is the level of blue equivalent to the max level of water (more dense means darker)
const float MAX_BLUE = 1.0;  // lightest blue, equivalent to the min level of water (less dense)

// percentage of water that is allowed to flow outwards in a single step
const float WATER_CURRENT_COEFFICIENT = 0.85;

bool isWater(vec4 point) {
    return point.b >= MIN_BLUE && point.b <= MAX_BLUE && point.r <= 0.0 && point.g <= 0.0;
}

bool isEmpty(vec4 point) {
    return point.r + point.g + point.b <= 0.0;
}

bool isBlock(vec4 point) {
    return point.r > 0.5 && point.g > 0.5 && point.b > 0.5;
}

float zeroIfOutOfBounds(float value, float min, float max) {
    // check if below lower bound
    value = step(min, value) * value;
    // check if above upper bound
    value = (1.0 - step(max, value)) * value;
    return value;
}

vec2 diff(vec2 ref, float du, float dv) {
    return vec2(ref.x + du * cellSize, ref.y + dv * cellSize);
}

float blueToWater(float blue) {
    return (blue - MIN_BLUE) * (MIN_WATER_LEVEL - MAX_WATER_LEVEL) / (MAX_BLUE - MIN_BLUE) + MAX_WATER_LEVEL;
}

float waterToBlue(float water) {
    return (water - MAX_WATER_LEVEL) * (MAX_BLUE - MIN_BLUE) / (MIN_WATER_LEVEL - MAX_WATER_LEVEL) + MIN_BLUE;
}

vec4 getInputPixel(vec2 coord) {
    return texture2D(sampleTexture, coord.xy);
}

float getWaterLevel(vec2 coord) {
    vec4 color = getInputPixel(coord);
    if (isWater(color)) {
        return blueToWater(color.b);
    } else if (isBlock(color)) {
        // FixMe this should be working to make water not disappear when in contact with block
        return -100000.0;
    }
    return 0.0;
}

vec4 calculateOutwardsFlowAtPosition(vec2 pos) {
    float center = getWaterLevel(pos);
    float top = getWaterLevel(diff(pos, +0., +1.));
    float right = getWaterLevel(diff(pos, +1., +0.));
    float down = getWaterLevel(diff(pos, +0., -1.));
    float left = getWaterLevel(diff(pos, -1., +0.));

    // FixMe this makes water evaporate very quickly because at each iteration more water is removed
    //       I guess we need a rule for transferring all water if below a certain threshold,
    //       so it doesn't fragment and end up evaporating
    float totalMaxCurrent = WATER_CURRENT_COEFFICIENT * center;

    float potentialTop = max(0.0, totalMaxCurrent - top);
    float potentialLeft = max(0.0, totalMaxCurrent - left);
    float potentialRight = max(0.0, totalMaxCurrent - right);
    float potentialDown = max(0.0, totalMaxCurrent - down);

    const float SIDEWAYS_FACTOR = 10.0;
    const float DOWN_FACTOR = 200.0;

    vec4 potential = vec4(
        potentialTop,
        potentialRight * SIDEWAYS_FACTOR,
        potentialDown * DOWN_FACTOR,
        potentialLeft * SIDEWAYS_FACTOR);

    float totalPotential = dot(potential, UNITY);  // trick to sum all vec4 params

    if (totalPotential <= 0.0) {
        return vec4(0.0);
    }

    vec4 conductance = potential / totalPotential;

    vec4 waterCurrent = conductance * totalMaxCurrent;
    return waterCurrent;
}

float calculateOutwardsFlow() {
    vec4 flow = calculateOutwardsFlowAtPosition(uvCoords.xy);
    // sums all currents out and considers it negative flow
    return -1.0 * dot(flow, UNITY);
}

float calculateDiffFromTop() {
    vec4 flow = calculateOutwardsFlowAtPosition(diff(uvCoords.xy, 0.0, +1.0));
    return flow.z;  // return flow going down
}

float calculateDiffFromDown() {
    vec4 flow = calculateOutwardsFlowAtPosition(diff(uvCoords.xy, 0.0, -1.0));
    return flow.x;  // return flow going up
}

float calculateDiffFromRight() {
    vec4 flow = calculateOutwardsFlowAtPosition(diff(uvCoords.xy, +1.0, 0.0));
    return flow.w;  // return flow going left
}

float calculateDiffFromLeft() {
    vec4 flow = calculateOutwardsFlowAtPosition(diff(uvCoords.xy, -1.0, 0.0));
    return flow.y;  // return flow going right
}

void main() {
    vec4 previousColor = getInputPixel(uvCoords.xy);

    if (isBlock(previousColor)) {
        gl_FragColor = previousColor;
        return;
    }

    // only water and empty space will be processed below here

    float initialWaterLevel = isWater(previousColor) ?
        max(MIN_WATER_LEVEL, blueToWater(previousColor.b)) :  // had to use max() owing to apparent precision problems
        0.0;

    // outgoing water (negative or zero)
    float diffMine = calculateOutwardsFlow();

    // incoming water (positive or zero)
    float diffFromTop = calculateDiffFromTop();
    float diffFromRight = calculateDiffFromRight();
    float diffFromDown = calculateDiffFromDown();
    float diffFromLeft = calculateDiffFromLeft();

    float waterLevel = initialWaterLevel + diffMine + diffFromTop + diffFromRight + diffFromDown + diffFromLeft;

    // "evaporate" water if below minimum acceptable level
    waterLevel = step(MIN_WATER_LEVEL, waterLevel) * waterLevel;

    if (waterLevel <= 0.0) {
        // became (or stayed) empty space
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // clamp if above max water level
    waterLevel = min(waterLevel, MAX_WATER_LEVEL);

    if (waterLevel < MIN_WATER_LEVEL) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        float blueLevel = waterToBlue(waterLevel);

        gl_FragColor = vec4(0.0, 0.0, blueLevel, 1.0);
    }
}
