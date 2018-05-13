
# Cellular automata water flow simulation running on the GPU

This is an experiment on how to convincingly simulate water flow using a classical cellular automata system where all cells in the grid are considered automata. The proposal here is to use this approach while also implementing it using GPGPU techniques in WebGL, a somewhat difficult task since WebGL currently does not have such a thing as a compute shader yet.

## Popular approaches to automaton water simulation

When it comes to simulate water flowing, the first thing that comes to my mind are those popular "sand games" over the internet. I bumped into one of them made in Java over more than a decade ago and became fascinated with it. The idea is simple: treat the canvas as a grid where each pixel may or may not contain a particle. A particle may be a solid block, water, sand, wax, fire, etc... but let's focus on water.

Water flows and that's the beauty of those simulations, to watch it as it flows down. The basic concept is to loop over all particles and update them at every simulation tick. Since it's difficult to keep track of thousands of moving particles that interact with its close neirghbors, to efficiently iterate over them one would need to recur to some sort of R-tree, quad-tree, etc... but I guess most implementations just keep it simple and iterate over the whole grid of pixels, simply skipping those that are empty. It's not that bad if your number of particles is close to the number of cells in the grid.

Water wants to flow down. When the simulation is iterating over the grid and finds a water particle, here's a possible naive approach to update it: is there space below me? If there is, move me down. Paint my pixel black and paint the pixel below me blue. Done. Let's not consider concurrency issues yet (more on that below). If that was the only rule, water would not behave convincingly. Water particles would stack on top of each other, not filling wide containers as they should. You'd expect water to fall down and, if the bottom cell is taken, try flowing down sideways, naturally spreading and not stacking like solid, sticky blocks. I won't get into much more detail here; for now, I just want to give an idea of the rules involved.

But there's also the concurrency issue I mentioned. If your're iterating over the grid, you're probably starting at the top row, scanning from left to right, then passing to the next row and so on. It means that that water particle that was just updated which flowed to the cell below it will get processed again when the iteration gets to the next row. The result will be that when you're done iterating the grid, the water will have magically teleported to the bottom of the simulation canvas. Nobody would see if animating down; it would just appear at the very bottom in the next canvas draw. So we find out we can't just update the bottom cell right away. Well, let's do it bottom up, then! No good either. You're still going to have concurrency problems with left and right neighbors (and possibly the top and corner neighbors as well, depending on your rules). So one easy solution is to mark cells as "dirty" and apply changes to them only after grid iteration is complete. Then you can iterate over it once again, but this time only applying changes previously calculated.

Authors often refer to their water particle simulations as cellular automata. But those are not classical automata, so to speak. In those simulations, the canvas grid does not perfectly map into an automata grid since only particles are automata, not empty spaces. Moreover, neighborhood is frequently changing since the automata are constantly moving throught the canvas. To make it more weird, not all of their neighbors are automata; some are this kind of inanimate stuff that are represented as black pixels in the canvas - empty space. They influence automata in their neighborhood, but they are not proper cells since they do not "think" (i.e., have their own processing moment during a simulation iteration) like real automata. My approach will differ a bit from those simulations as each of my canvas cells maps 1:1 to a celullar automaton.

## My approach

I've played with automata before using web technologies. Drawing to HTML5 canvas using the CPU and the correct data structures, you can get up to thousands of particles easily. Depending how easy neighborhood interaction calculations are, you can get even [hundreds of thousands](http://luciopaiva.com/rock-paper-automata/) but not much more than that without sacrificing frame rate. Drawing to HTML5 canvas pixel by pixel is too slow. We need to use WebGL canvas instead if we want to simulate bigger areas with lots of particles all over the place. But what if we want to fill the whole screen with particles? Altouhgh we're now using a WebGL canvas, we're still using the CPU to run neighborhood interaction calculations. Say screen resolution is 1920x1080 and we're running full screen. That's 2 million particles! No way we'd be able to simulate that with late 10's technology. Maybe you're in the late 20's reading this old article and laughing right now... well, I hope you're laughing otherwise your CPUs still suck and that's bad!

Since I want to tackle this challenge of simulating millions of particles, I decided to try the GPU for the first time. I've never even played with shaders before, so it will be fun.

One thing I learned about WebGL shaders (fragment shaders, more specifically) is that you can output only one pixel per run. Your shader is called once per pixel to be updated on the screen and you can't update more than one at the same very execution. You can't even write to an auxiliary buffer either. The only output is the single pixel being updated right now.

That means our cellular automata can't resort to the popular approach of making change to neighbors and it's difficult to simulate water if the only state you can change is the only cell's being iterated. My first approach (which you can see [here](http://luciopaiva.com/automaton-lab/)) was to simulate it like a classical approach would (e.g., [Conway's game of life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life)), in which empty spaces are treated as automata too. Bringing it to the context of water simulation, these could be our initial rules:

- if I am water and the cell below me is space, turn me into space (or "die" as one could say in a classical automata system);
- if I am space (aka "dead") and there's water above me, turn me into water (or "become alive")

With those two simple rules we'd simulate water falling just like it was described in the beginning of this article (i.e., like solid blocks falling and stacking up).

But things get complicated quickly. What if your bottom neighbor is also water? You can't move down, right? Well, it depends. If there's space below your bottom neighbor, it will flow down in the next state, so you should too, otherwise an unnatural space will appear between you. If you draw a big drop of water, there will be several "lines" of water flowing down with spaces between them; definitely not natural.

We could expand your neighboord to the next level and check if there's empty space below our bottom neighbor, but that would just postpone the problem if there's more water below. You would have to search all water neighbors down to find out if there is space to check if everybody can flow one cell down or not. It gets worse if you make a new rule saying that if there are two stacked water cells, the top one can flow down to the right or to the left in case the bottom one can't flow down anymore. Let's say water chose to flow down to the right, but there's water there. How to tell if the water there can flow down so we can occupy its space? See, I told it would get worse. It looks like there's no way to solve it, but there is.

## Compressible water

There's this now somewhat popular idea of turning water into a compressible liquid so simulated water can flow more smoothly. [Jon Gallant's simulation](http://www.jgallant.com/2d-liquid-simulator-with-cellular-automaton-in-unity/) uses this technique. Instead of just holding water or not, each cell can hold a certain amout of water above its comfortable level, hoping that in the next few global states things will converge to a balanced state again. In his simulation, each cell signals its flow intentions to its neighbors by telling how much water they should take from it. Water tends to go down, but it also spreads sideways even if the bottom neighbor could hold all the water. More than that, it's possible for water to go up if neighbors are too dense (this movement up is important to solve the communicating vessels problem, but let's not discuss it now).

It is not so easy, though, because cells receiving flow may be getting it from more than one neighbor. So we have to accumulate it somehow and only commit our final density after all neighbors have run.

That seems to work fine, but it's not easy to do it using WebGL shaders, since there's no way to accumulate data in a single fragment shader pass. During a single cell processing, it would compute how much flow it wants to move to its neighboring cells, but where to annotate it since the only output is the fragment pixel color?

## Several shaders...

My initial idea was to run 9 shaders in parallel. Each one would be in charge of telling one of our neighbors how much flow it should receive from us ("us" being each cell being iterated). There are only 8 neighbors, but the ninth shader is to compute by how much should we decrease our water level (if at all).

Then, after all 9 shaders have run, we run one extra and final shader which will receive 9 arrays containing, for each cell, the diff coming from each of its neighbors, including itself. This last shader will then act like a *reduce* step, summing up all the differences and persisting each cell's final state based on that. Once that is done, an itearation is complete. Now repeat that for every frame and water you flow down.

## ...or one shader to rule them all

But then I thought of another way of doing it, one which involves a single shader pass. In my initial approach, I was looking at each cell as a source of water, but I think it makes more sense (for the GPU approach) to think of it as water sinks. For each fragment, impersonate every neighbor of mine and calculate its flow towards me. Then sum it up and apply it to me, but also subtract the flow going outwards, if any. This way we can do it all in a single shader pass, with the penalty of calculating a total of 9 times the flow of each cell. I know it's a shame and it would be awesome if we could memoize it somehow, but I don't see how using the tools a WebGL shader gives us. Anyway, it's the same amount of calculation done with all 9 shaders of my first approach, but asking it all at once to the GPU.

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

---

Good cellular automata liquid
http://www.jgallant.com/2d-liquid-simulator-with-cellular-automaton-in-unity/
But I think he needs to overwrite the same buffer, bottom up, otherwise his algorithm won't work as expected (because of the stacked falling water issue).

Some notes on Jon's algorithm:

https://github.com/jongallant/LiquidSimulator/blob/8b57f684e2710192946fe53644e8e2bc2db2086a/Assets/Scripts/LiquidSimulator.cs

- One concurrency issue happens when a cell changes its amount of water. It marks its neighbors as "unsettled", but since the simulation is updated top-to-bottom, left-to-right, cells above and to the left have already been stepped and will only be aware of the change in then next step. On the other hand, cells to the right and to the bottom will sense the change on this very iteration! I'm not sure what kind of problems this may bring, though;

---

## Notes

> According to [GLSL ES v3 specification](https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf), `#version` must be specified or the compiler will assume `#version 100 es` by default. I tried specifying it in my script, but the compiler complained about `#version` not being the first thing in the script. Then I realised that Three.js is prepeding stuff to my script. This also means that all shader scripts fed to Three.js must use v1.00 regardless. There's [an issue](https://github.com/mrdoob/three.js/issues/9965) open in Three.js's GitHub page asking for WebGL2 support, [which brings support to ES v3](https://webgl2fundamentals.org/webgl/lessons/webgl1-to-webgl2.html), but it's been more than an year since the issue was opened and I don't know what's the progress on that.

> Three.js defines several variables that are prepended to user's shader script. `projectionMatrix`, `modelViewMatrix` and `position` are some of them (these 3 variables are frequently used in scripts that just set `gl_Position` and do nothing more).

> I found out there's one way to use WebGL v2 with Three.js right now, which is to create the shader using [`RawShaderMaterial()`](https://threejs.org/docs/#api/materials/RawShaderMaterial). You won't get those injected variables mentioned above, but, in the other hand, you get to say which GLSL version you want to use (i.e., you can specifify `#version 300 es` in the first line and then use whatever feature is available).
