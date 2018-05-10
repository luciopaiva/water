
varying vec2 _uv;
varying vec3 _position;

void main() {
    // pass them to the fragment shader
    _uv = uv;
    _position = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
