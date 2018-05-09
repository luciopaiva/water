
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

//uniform float uTime;
//varying vec2 vUv;
//uniform sampler2D tDiffuse;
//
//void main() {
//
//    vUv = uv;
//
//    vec4 tex = texture2D(tDiffuse, vUv);
//
//    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
//
//}
