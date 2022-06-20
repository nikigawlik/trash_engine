plan
- keep it simple
- use existing libs

engine:

resource types:
- sprite (image, tile)
- sound
- object (prototype, template)
- room (level, map, scene)

some ideas: 
- rooms are objects (assuming a hierarchy, it's an objects that places / contains objects, really)
- sprites can be placed directly ("tiles")

rougelike
- do menuing first

structure
- p5js -> enforces it's structure, kind of
- my scripts -> are function level -> custom format
- shit's in the global scope
- internal structure -> modules
  - main
    - graphics
    - sound
    - resource manager
- game is fundamentally descriptive
- resources + data + scripts
- objects and instances -> object has the event functions, calls them for instances!

todos
- dev server 
  - file registry?