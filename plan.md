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





UNDO functionality

option1: save duplicate(s) of the entire state -> only have 1-2 undos to save on memory
(only 1 undo means that you don't need redo, because redo is just double undo)

option2: save local transitions for (re)do and undo
  e.g. { 
    do: set sprites[1][3].canvas to {Canvas} // canvas after change
    undo: set sprites[1][3].canvas to {Canvas} // canvas before change
  }

