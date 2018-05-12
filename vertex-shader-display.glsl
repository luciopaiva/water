
varying vec2 uvCoords;

void main() {
    // pass it to the fragment shader
    uvCoords = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
