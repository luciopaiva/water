
uniform sampler2D sampleTexture;
uniform float cellSize;
varying vec2 uvCoords;

bool isWater(vec4 point) {
    return point.b > 0.0 && point.r <= 0.0 && point.g <= 0.0;
}

bool isEmpty(vec4 point) {
    return point.r + point.g + point.b <= 0.0;
}

void main() {
    vec4 me = texture2D(sampleTexture, uvCoords.xy);
    vec4 below = texture2D(sampleTexture, vec2(uvCoords.x, uvCoords.y - cellSize));
    vec4 above = texture2D(sampleTexture, vec2(uvCoords.x, uvCoords.y + cellSize));

    if (isWater(me) && isEmpty(below)) {
        me = vec4(0.0, 0.0, 0.0, 1.0);
    } else if (isEmpty(me) && isWater(above)) {
        me = vec4(0.0, 0.0, 1.0, 1.0);
    }

    gl_FragColor = vec4(me);
}
