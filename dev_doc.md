
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

