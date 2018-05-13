
uniform sampler2D sampleTexture;
uniform float cellSize;
varying vec2 uvCoords;

bool isWater(vec4 point) {
    return point.b > 0.0 && point.r <= 0.0 && point.g <= 0.0;
}

bool isEmpty(vec4 point) {
    return point.r + point.g + point.b <= 0.0;
}

bool isBlock(vec4 point) {
    return point.r > 0.5 && point.g > 0.5 && point.b > 0.5;
}

vec2 diff(float du, float dv) {
    return vec2(uvCoords.x + du * cellSize, uvCoords.y + dv * cellSize);
}

void main() {
    vec4 me = texture2D(sampleTexture, uvCoords.xy);
    vec4 n =  texture2D(sampleTexture, diff(+0., +1.));
    vec4 ne = texture2D(sampleTexture, diff(+1., +1.));
    vec4 e =  texture2D(sampleTexture, diff(+1., +0.));
    vec4 se = texture2D(sampleTexture, diff(+1., -1.));
    vec4 s =  texture2D(sampleTexture, diff(+0., -1.));
    vec4 sw = texture2D(sampleTexture, diff(-1., -1.));
    vec4 w =  texture2D(sampleTexture, diff(-1., +0.));
    vec4 nw = texture2D(sampleTexture, diff(-1., +1.));

    vec4 EMPTY = vec4(0.0, 0.0, 0.0, 1.0);
    vec4 WATER = vec4(0.0, 0.0, 1.0, 1.0);

    // ToDo instead of using nested conditions, compute integer representing neighborhood state (9 bits should be
    //      enough) and then do single comparison

    if (isWater(me)) {
        if (isEmpty(s)) {
            me = EMPTY;
        } else if (isEmpty(se)) {
            me = EMPTY;
        } else if (isEmpty(sw)) {
            me = EMPTY;
        }
    } else if (isEmpty(me)) {
        if (isWater(n)) {
            me = WATER;
        } else if (isWater(nw) && !isEmpty(w)) {
            me = WATER;
        } else if (isWater(ne) && !isEmpty(e)) {
            me = WATER;
        }
    }

    gl_FragColor = vec4(me);
}
