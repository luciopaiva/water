
It is difficult to simulate water if you just can change your own state and not your neighbors'. If you are water and your neighbor below is empty, to flow down you need to become empty and ask your neighbor to, during its update, to turn into water.

Things get complicated quickly. What if your bottom neighbor is also water? You can't move down, right? It depends. If its is also water, you should move down, otherwise there will be an artificial space between you and your bottom neighbor. But how to tell if your neighbor is flowing down if you just can't see what's below it? We could expand your neighboord to the next level, but that would just postpone the problem. You would have to search all water neighbors down to find out if there is space so that everybody can flow one down or not. It gets worse if you make a new rule saying that if there are two stacked water cells, the top one can flow down to the right or to the left in case the bottom one can't flow down anymore. Let's say water chose to flow down to the right, but there's water there. How to tell if the water there can flow down so we can occupy its space? See, I told it would get worse. It looks like there's no way to solve it. Not with a single pass... se below.

There's this popular idea of turning water into a compressible liquid so simulated water can flow more smoothly. [Jon Gallant's simulation](http://www.jgallant.com/2d-liquid-simulator-with-cellular-automaton-in-unity/) uses that technique. Instead of just holding water or not, each cell can hold up to a certain amout of water above its comfortable level, hoping that in a few global states things will converge to a balanced state again. In his simulation, each cell signals its flow intentions to its neighbors by telling how much water they should take from it. Water prefers to go down always, but if the bottom neighbor is too compressed, it will prefer to go sideways. As a last resort, it will try to relieve its density by flowing up.

It is not so easy, though, because cells receiving flow may be getting it from more than one neighbor. So we have to accumulate it somehow and only commit our final density after all neighbors have run.

That seems to work fine, but it's not easy to do it using WebGL shaders, since there's no way to accumulate data in a single shader pass. So here's my idea: run 9 shaders in parallel. Each one will be in charge of telling one of our neighbors how much flow it should receive from us. There are only 8 neighbors... the ninth shader is to compute how much we should decrease ourselves (if at all).

Then, after all 9 shaders have run, we run one extra and final shader which will receive 9 arrays containing, for each cell, the diff coming from each of its neighbors, including itself. This last shader will then just sum up all differences and persist each cell's final state. Repeat that for every frame and you're good to go.

How to encode information about the amount of water flowing each direction? Each cell will have 32 bits of space to tell how much water the n-th neighbor should receive. Since there's so many bits, we could even compress calculations and compute flow for more than one neighbor in each shader. It all depends on how much flow variation we could have.

Let's also stop a bit to define how density will be seen. My idea is that a cell will be 255 blue if its density is normal and something below it if it is compressed, so that compressed cells will appear darker. How much compression could a cell take? Well, let's say we could range blue from 255 down to 100, so it's its blue and we have 155 possible density levels. But how dense would 155 be? Maybe twice as dense? Three times? Four? Let's say twice for now. So if a neighbor cell wants to flow entirely into us, we would be receiving 155 from it. How many bits are necessary to represent that? 8, so with 32 bits we could possibly represent 4 flow directions. We could also accept more than that, going all the way from 255 to zero... well, close to zero. We'd have to be a bit above it to differentiate water from empty space, which is black. Or we could mask empty space temporarily as some different color and then map it to black in the final rendering.

Considering 4 flow directions per shader, we'd now have 3 shaders to calculate all neighbors directions plus one final shader to receive all that and sum it. Not bad, looks feasible.

---

GoL made in Three.js
http://charliehoey.com/threejs-demos/shader-game-of-life.html
This project is what I'm using as base for my code.

Chris Wellons' GoL in Igloo
http://nullprogram.com/blog/2014/06/10/

Chris Wellons' liquid simulator
http://nullprogram.com/fun-liquid/webgl/
When I get to make a "sand game", this could be how the water is rendered

regl particles example
http://regl.party/examples

Good cellular automata liquid
http://www.jgallant.com/2d-liquid-simulator-with-cellular-automaton-in-unity/
But I think he needs to overwrite the same buffer, bottom up, otherwise his algorithm won't work as expected (because of the stacked falling water issue).

---

## Notes

> According to [GLSL ES v3 specification](https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf), `#version` must be specified or the compiler will assume `#version 100 es` by default. I tried specifying it in my script, but the compiler complained about `#version` not being the first thing in the script. Then I realised that Three.js is prepeding stuff to my script. This also means that all shader scripts fed to Three.js must use v1.00 regardless. There's [an issue](https://github.com/mrdoob/three.js/issues/9965) open in Three.js's GitHub page asking for WebGL2 support, [which brings support to ES v3](https://webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html), but it's been more than an year since the issue was opened and I don't know what's the progress on that.

> Three.js defines several variables that are prepended to user's shader script. `projectionMatrix`, `modelViewMatrix` and `position` are some of them (these 3 variables are frequently used in scripts that just set `gl_Position` and do nothing more).

> I found out there's one way to use WebGL v2 with Three.js right now, which is to create the shader using [`RawShaderMaterial()`](https://threejs.org/docs/#api/materials/RawShaderMaterial). You won't get those injected variables mentioned above, but, in the other hand, you get to say which GLSL version you want to use (i.e., you can specifify `#version 300 es` in the first line and then use whatever feature is available).
