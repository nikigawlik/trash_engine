# This

This is a document containing all kinds of random ideas and research notes concerning the engine...


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

Sooo Idea:
"trash engine lib" is licensed under the LGPL (v...) license.
The contents of "gamedata" are subject to copyright.
Uless specified otherwise contents of this file are licensed under the MIT license.


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


## type/polymorphism system for sprites

problem: we often address a specific sprite like "is instance colliding with `wall`?"
but sometimes we want multiple kinds of walls.

e.g. door       is a type of wall
     brick_wall is a type of wall
     vine       is a type of wall

this goes two ways:
  1. a type/id is being passed to a function, like collisionAt(slf, wall, x, y)
  2. all things of type share some behaviour, like all "mobs" run movement code.

GameMaker solves both problems at once with an inheritance system.
-> if door inherits from wall, passing `wall` to a function will also target doors.
-> if goblin inherits from enemy, goblin will execute all of the same event code as enemy.

Unity has a mix of solutions for this: Tags, layers, collision masks, manually checking for component presence, naming conventions of GameObjects.
-> Unity doesn't have a unified solution, it's addressed separately in different situations.

So:
  1. How does the user say "a door is a wall"?
  2. Does that setting also imply inheritance of behaviour?

Solutions: 

For 2. I should go with some component/modular system. Behaviour shouldn't be inherited, it should be shared in a "has a" kind of way. The obvious solution right now would be to make "behaviours" a separate resource, which can be added to the resource manager, and reused for different sprites.

For 1. I should have some kind of classification system. At least the following types exist:
 - sprite type: refers to all instances with a specific spriteID 
 - tag type: refers to all instances tagged with a specific tag
 - "all" type: refers to all instances
 - filter type: a function that filters instances

Implementation notes:

 - for tag we can use WeakSet -> every tag is a weak set, containing all the instances.
 - for sprite we can use string comparison, but it could also be implemented as a weak set.
 - all type could be a special key word, or, again, also a weak set containing all instances. :p
 - filter would need to be a special case, because it's dynamic

what does the user pass to a lib function like collisionAt?

- a uuid string? -> the WeakSets could have uuids of their own. there is a uuid to WeakSet converter somewhere.
- a WeakSet? -> I need to change the value of the resource global property to a WeakSet.

Full weak set based implementation:

`instance` is `thing`? == thing.has(instance)

 - properties now point to WeakSets
   - the global property `<sprite>` contains a weak set of all instances of `<wall>`
   - the global property `all` contains a weak set of all instances
   - the global property `noone` containts a empty weak set
   - the global property `<tag>` contains a weak set of all instances tagged with `<tag>`
 - to iterate a `thing: WeakMap`, we iterate all instances and do `thing.has(instance)`
 - this does not fuck up garbage collection
 - the lib function `tag(instance: SpriteInstance, tagName: string)` sets/modifies `window[tagName]` allowing for analogous use to sprites
 - there should also be a tagging funtion in the UI

- downsides: the globabl properties are now something that users don't have any relationship to
- alternative: 
  - global properties are not WeakSets, but rather uuids
  - there is a simple lookup map that contains the actual weak sets



## rendering

We send different arrays of 4d vectors to the shader.

- uv position + uv size (texcoords rectangle)
- color, alpha (rgba)
- position + origin (x, y, ox, oy)
- scale + rotation (sx, sy, a)  (could also be(sx, sy, cos a, sin a), (2d matrix...))

in the shader we then do

_step_                                top left and bottom right corners
start unit rectangle vertex position  (0, 0) (1, 1)
scale by uv size                      (0, 0) (60, 60)
move by origin                        (-30, -30) (30, 30)
scale                                 (-15, -15) (15, 15)
rotate                                (15, -15) (-15, 15)

alternative: just send matrix lol


### buffer based imperative drawing

have an onmi-shader that can render everything -> chooses based on an enum int

drawThing() { // do calc   buffer.push(renderObject) }

RenderObject: 
 - type
 - object info
 - additional transformation matrix

things to draw: 
  - sprites
  - shapes (outline + fill)
    - line   -> is a quad
    - rectangle  -> is a quad
    - triangle  -> not a quad, but we can ignore the second tri?
    - circle  -> is a quad
    - quad -> is a quad
  - repeating textures ?

everything is just a quad, at the end of the day


## movement theory

Movement ideas can be generated

- Obstacle driven
  - distance based: vertical or horizontal gap to traverse
  - special interactive element: grab point, breakable wall
  - tight squeeze: small gaps, requires shrinking

- Player driven
  - a) remove a constraint, examples: double jump, infinite jump
  - b) add a new state 
    - input driven: morphball, dash
    - context driving: hanging from ledge, sticking to wall
  - c) tweak parameter: jump height, move speed, etc.

- Input types:
  - Context driven -> applies automatically in certain contexts (auto-duck, ledge grabs, etc.)
  - Input driven -> User presses a button(-combination)
  - Hybrid -> The effect of the input changes based on context (wall jump, generic interact button, duck to slide)


# UI refactor

important shit
- new project 
  - from example
  - empty
- new...
  - sprite
  - room
  - sound


# data management & undo / redo
data is somewhere (central?)
transformations of data are well defined -> allows for undo/redo

example: 
- cards -> open/close
- resource -> create, read, update, delete

stores: list of things -> create, [read, ]update, delete
- inverses: create/delete
- update: diff -> path, previous, current
- an action can be a list of diffs
- subscribe to a path -> changes to obj and children trigger update
  - parent store --subscribes--> child store
  - or no stores, just paths?
  - or index / database

possible research: selective undo

possible data structures
- blobs + index (canvases are blobs, might be compressed or something?)
- actions / diffs (see above)
- everything is a big tree (but that doesn't exclude some index/head kind of thing, it just means we have paths)

design rules: 
- undo is neccessary when:
  - manually undoing some actions is very hard (more clicks, or impossible (deletion))
  - the user doesn't know how to undo (accidental clicks, accidentally hit a keyboard shortcuts, etc.)

anti-undo: 
- no-undo can be fun! => it's like paper, you have to commit to something
- you never lose to much progress because the scope of the project is small
- there are saves for when you really need to undo a fuckup
- counter:
  - deleting things accidentally really can happen
  - can be useful for graphics & sound
- access only through stores
  - Resource manager has all the data
  - only exposes stores
  - stores enforce crud

# visual programming language #

small square blocks arranged like this:
```
  \/  <-------.
[ if ]--.     /\
  |     \/    /\
  |   [ op ]  /\
  |   [ ak ]  /\
  |   [ lm ]  /\
  V     \/    /\
[ mv ]<-'     /\
[ cl ]        /\
[ cl ]        /\
[ if ]--------'
  \/ 
```

It's basically assembly, but jumps are clearly indicated by arrows
Also basic instructions are very high level of course!
Also this might (might!) double as a dialog system!

This hides a lot of details in the blocks, which is good, i think

Also you could do crazy time branching shit with async!
(basically break of a behaviour into an async function)
let people use everyhting like they use coroutines in unity!

let's also say a block is a bit like an excel cell 
-> it can have state! (oh no lol)
-> the declaration of a variable _is_ the variable (conceptually)
-> a variable can be declared in reference to another variable
-> unlike excel, execution order is explicit

crossroads, pick one: 
- code is interpreted
- code compiles to js
- blocks/statements are data, but inner-block code are compiled

if it compiles to js, then we can't do completely free GOTO,
it's going to have to be loops

individual blocks can still always be javascript though.
'variables' still can be fields!

the blocks are still kinda like blueprints
but it's less messy (lol really?)
and there is crucially not data shit
there is no data flow to speak of
so it's kind of not real programming tbh, and that's ok
you can do some excel bullshit tho
- like instead of number just put in random(0, 4)
- or put in a reference to another variable
- etc. (it's like game maker lol, it's literally just game maker)

Implementation could be a css grid
or a table
or something like that


# room editor / general ui musings

the camera can just be another game object

construct is pretty kewl

i can't compete with construct lol :p

easy flip between edit & play

2 different UI philosophies:
- every editor has a window (sprite editor, room editor)
- every resource has a window
- 