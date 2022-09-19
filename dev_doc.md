
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



HOW to do web worker custom js:
// create blob
let b = new Blob(["this is javascript"], { type: 'text/javascript' }) ;
let w = new Worker(window.URL.createObjectURL(blob));
document.worker.onmessage = (event) => {
  console.log(`Received: ${event.data}`);
};
window.onload = () => { w.postMessage(''); };


Packaging a game ->

index.html
sprites/
ooor -> atlas?
pixi lib