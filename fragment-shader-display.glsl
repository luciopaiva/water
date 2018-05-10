
uniform sampler2D sampleTexture;
varying vec2 _uv;
varying vec3 _position;

void main() {
//    gl_FragColor = vec4(texture2D(sampleTexture, vec2(_uv.x, _uv.y)));

    const float arbitraryPeriod = 200.;
    gl_FragColor = vec4(texture2D(sampleTexture, _position.xy / arbitraryPeriod));
}
