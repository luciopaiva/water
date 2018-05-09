
void main() {
    gl_FragColor = vec4(.3, 0.0, 0.0, 1.0);
}

//
//varying vec2 vUv;
//uniform float uTime;
//uniform sampler2D tDiffuse;
//
//void main() {
//
//    // round vUv to the nearest 1/2048th of
//    vec2 newUv = vec2(vUv.x * 2048. * (1. / 2048.), vUv.y * 2048. * (1. / 2048.));
//
//    vec4 tex = texture2D(tDiffuse, newUv);
//
//    gl_FragColor = vec4( tex.rgb, 1. );
//}
