
uniform sampler2D sampleTexture;
varying vec2 uvCoords;

void main() {
    gl_FragColor = texture2D(sampleTexture, uvCoords.xy);
}
