
uniform sampler2D sampleTexture;
varying vec2 uvCoords;

bool isWater(vec4 point) {
    return point.b > 0.0 && point.r <= 0.0 && point.g <= 0.0;
}

bool isEmpty(vec4 point) {
    return point.r + point.g + point.b <= 0.0;
}

void main() {
    // ToDo receive cellWidth instead of calculating for every fragment
    float cellWidth = 1. / 2048.;
    vec4 me = texture2D(sampleTexture, uvCoords.xy);
    vec4 below = texture2D(sampleTexture, vec2(uvCoords.x, uvCoords.y - cellWidth));
    vec4 above = texture2D(sampleTexture, vec2(uvCoords.x, uvCoords.y + cellWidth));

    if (isWater(me) && isEmpty(below)) {
        me = vec4(0.0, 0.0, 0.0, 1.0);
    } else if (isEmpty(me) && isWater(above)) {
        me = vec4(0.0, 0.0, 1.0, 1.0);
    }

    gl_FragColor = vec4(me);
}
