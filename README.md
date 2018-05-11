
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

---

## Notes

> According to [GLSL ES v3 specification](https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf), `#version` must be specified or the compiler will assume `#version 100 es` by default. I tried specifying it in my script, but the compiler complained about `#version` not being the first thing in the script. Then I realised that Three.js is prepeding stuff to my script. This also means that all shader scripts fed to Three.js must use v1.00 regardless. There's [an issue](https://github.com/mrdoob/three.js/issues/9965) open in Three.js's GitHub page asking for WebGL2 support, [which brings support to ES v3](https://webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html), but it's been more than an year since the issue was opened and I don't know what's the progress on that.

> Three.js defines several variables that are prepended to user's shader script. `projectionMatrix`, `modelViewMatrix` and `position` are some of them (these 3 variables are frequently used in scripts that just set `gl_Position` and do nothing more).

> I found out there's one way to use WebGL v2 with Three.js right now, which is to create the shader using [`RawShaderMaterial()`](https://threejs.org/docs/#api/materials/RawShaderMaterial). You won't get those injected variables mentioned above, but, in the other hand, you get to say which GLSL version you want to use (i.e., you can specifify `#version 300 es` in the first line and then use whatever feature is available).
