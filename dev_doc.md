
## GAME

lifecycle

- preprocess
- set up game, canvas, etc.
- before room load
- ~ spawn in all instances
- after room load
- ~ room start events
- ~ game start events
- ~ init events
- game start
- game loop
  - before step
  - ~ do inputs etc.
  - step
  - before draw
  - ~ draw defaults
  - draw
  - [other events, e.g. room end etc.]
  - after step
- room end
- game end  


## web workers ##
HOW to do web worker custom js:
// create blob
let b = new Blob(["this is javascript"], { type: 'text/javascript' }) ;
let w = new Worker(window.URL.createObjectURL(blob));
document.worker.onmessage = (event) => {
  console.log(`Received: ${event.data}`);
};
window.onload = () => { w.postMessage(''); };

## Getting rid of 'this' 

### Transpiled language

We just transpile stuff. -> all unrecognized variables are pre-pended with `this.`

### using `with(...) { ... }`

Just no, please

### Closure solution

Every instance has it's own closure, like;

```
function newInstance() {
  // start of init
  let x = 0; 
  let y = 0;
  let xspd = 2;
  let yspd = 3;
  // end of init


  let update = function() {
    // start of update
    x += xspd;
    y += yspd;

    console.log(`${x}, ${y}`)
    // end of update
  }

  return {update, get x() {return x;}, set x(v) {x=v} };
}
```

Some research and experimentation later:

Closures use about the same memory as a object which contains the captured variables:

=> Closure memory footprint is dependent on the amount of captured variables!

In firefox using update.call(instance) is about 2-3x slower than creating a bunch of update-functions with their own closures.

In chrome it's the same.

The problem with closures is how other objects are gonna access the vars?

```
let constr = (
  // object props
  v1, v2, v3, v4
  // /object props
) => {
  let update = () => {
    // update code
    v1 += 4;
    // /update code
  }
  let draw = () => {
    // draw code

    // /draw code
  }

  return {
    update,
    get v1() {return v1}, set v1(value) {v1 = value},
    get v2() {return v2}, set v2(value) {v2 = value},
    get v3() {return v3}, set v3(value) {v3 = value},
    get v4() {return v4}, set v4(value) {v4 = value},
  }
}
```

2 parts:
- generalized behaviour code container
- specialized code generator + UI -> svelte component

I can do either 
(1) update code, draw code, etc. as separate inputs
or 
(2) one big input, where update, draw, etc. are specified inline as...
- _either_ functions: `function update() {...}`
- _or_ as callbacks: `onUpdate(() => {...})`

onUpdate could work like `let update = () => {}; function onUpdate(cb) {update = (...args) => { update(...args); cv(...args); }}`

## Packaging / exporting a game ##

### overview ###

How are games exported?

There are two broad options: 
1. games are exported in a kind of custom "compiled" format.
2. games are just a differently configured version of the engine (engine + "launch this as a game" instructions)

One goal of trash engine is to make games very remixable.

Option 1 -> people would need to load the game's code back into a build of trash engine
 - This might lead to version conflicts
 - But it would encourage people to stay on the newest version
 - people can just stay on the web (itch or other uploads of the engine)

Option 2 -> people can basically just mod the game in-place, by adding a parameter like `?editor`
 - extremely easy to do for players
 - 

### custom
index.html
sprites/
ooor -> atlas?
pixi lib

Possible speed up:

Instead of doing everything modular with functions we just compile one giant function:

for(let i of instances) {
  if(...) // i is sprite0 
  { // sprite0 step event }
  if(...) // i is sprite1 
  { // sprite1 step event }
  if(...) // i is sprite1 
  { // sprite1 step event }
}


### custom html file

game.html is not svelte/vite etc.
it's just a pure html file!

this means strict separation between engine and game.

this allows the game to be _very_ lightweight.

for rendering it uses something very small like https://github.com/bitnenfer/tiny-canvas

game data is packaged in a script tag

Data is image urls.

runtime is minimal, and can be configurable (turn features on and off).


### as a folder ? ###

Exporting as a zip folder, not single file: 

Users need to run a dev server:
https://medium.com/swlh/need-a-local-static-server-here-are-several-options-bbbe77e59a11



## licensing ##

p5js -> lgpl
- including p5js is ok, especially if it's not minified
- if it is minified, in theory I need to offer a way for a user to find the unminified version?
- I need to include a copyright notice referring to p5js and GNU LGPL 2.1
 
- trash engine uses p5js ()
- any work made with trash engine uses p5js
- a work made with trash engine...
  - ... is a derivative of trash engine
  - ... or uses trash engine?

- "trash engine lib" -> LGPL
- "p5.js" -> LGPL
- index.html -> can be any license, preferably MIT

Sooo:

"trash engine lib" is licensed under the LGPL (v...) license.
"p5.js" is licensed under the LGPL 2.1 license.
The contents of "gamedata" are subject to copyright.
Uless specified otherwise contents of this file are licensed under the MIT license.

### example text ###

This software uses p5.js (https://github.com/processing/p5.js), which is released under the GNU Lesser General Public License v2.1. 

Games created with Trash Engine also contain a copy of p5.js. So please make sure to give proper attribution, for example by including the paragraph above alongside in alongside any other copyright notices in your game.





## serialization

{someLongVarName: number, b: number}[]

JSON-style:
[{someLongVarName: 123, b: 323}, {someLongVarName: 4, b: 12}, {someLongVarName: 2, b:12}]

smarter serializer:
{someLongVarName: [123, 4, 2], b:[323, 12, 12]}

2x3:
someLongVarName   b
123               323
4                 12
2                 12

-> [2, 3, "someLongVarName", "b", 123, 323, 4, 12, 2, 12]

Type:Instance: {someLongVarName: number, b: number}

Array[Instance (by object)]: [123, 323, 4, 12, 2, 12]
Array[Instance (by prop)]: [123, 4, 2, 323, 12, 12]