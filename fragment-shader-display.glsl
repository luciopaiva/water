
uniform sampler2D sampleTexture;

void main() {
    // take this square of side `repeatPeriod` from the texture and repeat it through the plane surface
    float repeatPeriod = 256.;
    // there's no mod operation in WebGL v1, so let's calculate it the hard way
    vec2 modCoord = gl_FragCoord.xy - vec2(ivec2(gl_FragCoord.xy / repeatPeriod) * int(repeatPeriod));
    // map the resulting value to [0, 1]
    vec2 textCoord = vec2(modCoord / 2048.);
    // finally, get the corresponding texel and return it
    gl_FragColor = vec4(texture2D(sampleTexture, textCoord));
}
