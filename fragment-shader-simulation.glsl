
varying vec2 vUv;
uniform float uTime;
uniform sampler2D tCurrentFront;
uniform float uSize;
uniform float uRandomize;
uniform float uMouseDown;
uniform vec2 uMouseCoords;

float random(vec2 p){return fract(cos(dot(p,vec2(23.14069263277926,2.665144142690225)))*123456.);}

void main() {

    float cellWidth = 1. / uSize;
    vec4 tex = vec4(0., 0., 0., 1.);



    // get the velocity of the current cell
    vec4 current = texture2D(tCurrentFront, vec2(vUv.x, vUv.y));

    // loop through neighbors and see how many are alive
    float neighbors = 0.;

    // // top row
    vec4 tl = texture2D(tCurrentFront, vec2(vUv.x - cellWidth, vUv.y - cellWidth));
    vec4 tc = texture2D(tCurrentFront, vec2(vUv.x, vUv.y - cellWidth));
    vec4 tr = texture2D(tCurrentFront, vec2(vUv.x + cellWidth, vUv.y - cellWidth));

    // // side neighbors
    vec4 l = texture2D(tCurrentFront, vec2(vUv.x - cellWidth, vUv.y));
    vec4 r = texture2D(tCurrentFront, vec2(vUv.x + cellWidth, vUv.y));

    // // bottom row
    vec4 bl = texture2D(tCurrentFront, vec2(vUv.x - cellWidth, vUv.y + cellWidth) );
    vec4 bc = texture2D(tCurrentFront, vec2(vUv.x, vUv.y + cellWidth) );
    vec4 br = texture2D(tCurrentFront, vec2(vUv.x + cellWidth, vUv.y + cellWidth));

    if(tl.g > .25) neighbors += 1.;
    if(tc.g > .25) neighbors += 1.;
    if(tr.g > .25) neighbors += 1.;
    if(l.g > .25) neighbors += 1.;
    if(r.g > .25) neighbors += 1.;
    if(bl.g > .25) neighbors += 1.;
    if(bc.g > .25) neighbors += 1.;
    if(br.g > .25) neighbors += 1.;

    // if we are currently alive
    if(current.r > .25) {
        // if we have fewer than 2. or greater than 3. neighbors, we die
        if(neighbors < 1.9 || neighbors > 3.1) {
            tex = vec4(0., 0., 0., 1.);
        } else {
            tex = vec4(1., 1., 1., 1.);
        }
    // if we are currently dead
    } else {
        if(neighbors > 2.9 && neighbors < 3.1) {
            tex = vec4(1., 1., 1., 1.);
        }
    }

    // use mouse interactions
    if(uMouseDown > 0.) {

        if(vUv.x >= uMouseCoords.x && vUv.x < uMouseCoords.x + 1. / uSize) {
            if(vUv.y >= uMouseCoords.y && vUv.y < uMouseCoords.y + 1. / uSize) {
                tex = vec4(1., 1., 1., 1.);
            }
        }

    }

    // float t = random(vUv + sin(uTime * .1));

    // find out what the value of the cell is that is where this cell was in the previous step
    // vec4 next = texture2D(tCurrentFront, vec2(vUv.x - ( (current.b - .5) * cellWidth), vUv.y - ( (current.g -.5) * cellWidth)));

    // vec3 n = vec3( .5, random(vUv + sin( uTime ) ), random(vUv + sin(uTime - 1.) ) ) - vec3(.5);

    // if the next cell is the same as the current one, randomize it a bit
    // if( next.g < .5 || next.b < .5 || next == current) {
    // 	next = vec4(next.rgb - (n * .01), 1.);
    // }


    gl_FragColor = vec4( tex.rgb, 1. );
}