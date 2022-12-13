## quick reference of functions & props for scripting

(This documentation is not comprehensive and a work-in-progress)

All resources (sprites, rooms, etc.) have a uuid (a long random string). When a function expects a sprite or room, pass the uuid.

There are global variables for all resources containing their uuid. So something like `player` (without quotes) can be passed to a function expecting a sprite, if you want to specify the player sprite.

The things you actually see in the game are `SpriteInstance`s, which are produced by placing a sprite in a room, or calling `spawn(...)`. they contain all the properties specified in their sprite's code. They also always have the default properties

- `x`, `y`,
- `spriteID`,
- `imgScaleX`, `imgScaleY`,
- `imgAlpha`,
- `imgColor`

Within the code of a sprite, you can use the `me` variable to refer to the SpriteInstance that is executing the code! But generally don't write something like `me.x`, instead just write `x`, it just works (because of behind-the-scenes trickery).

To get a reference to a different SpriteInstance, you can use a function like `find(...)`, `findAll(...)`, `findClosest(...)` or `instancesAt(...)`.

Below there is a list of all global functions and properties, which are hopefully mostly self-explanatory:

In the future there will be documentation for every function, but not right now, sorry!

- `roomWidth : number`
- `roomHeight : number`
- `mouseX : number`
- `mouseY : number`
- `all : string (uuid)`
- `noone : string (uuid)`
- `currentRoom : string (uuid)`
- `spawn(sprite: string, x: number, y: number) : SpriteInstance`
- `destroy(instance: SpriteInstance) : boolean`
- `find(sprite: string) : SpriteInstance`
- `findClosest(sprite: string, x: number, y: number) : SpriteInstance`
- `findAll(sprite: string) : SpriteInstance[]`
- `setDepth(self: SpriteInstance, depth: number)`
- `goToNextRoom()`
- `goToPreviousRoom()`
- `moveRooms(difference: number)`
- `nameOf(uuid: string) : string`
- `keyIsDown(...codes: string[]) : boolean`
- `keyIsPressed(...codes: string[]) : boolean`
- `keyIsReleased(...codes: string[]) : boolean`
- `collisionAt(instance: SpriteInstance, spriteID: string, x: number, y: number) : boolean`
- `instancesAt(instance: SpriteInstance, spriteID: string, x: number, y: number) : SpriteInstance[]`
- `lerp(a: number, b: number, factor: number) : number`
- `approach(a: number, b: number, speed: number) : number`
- `distance(x1: number, y1: number, x2: number, y2: number) : number`
- `colorRGBA(r: number, g: number, b: number, a?: number) : Color`
- `colorHSVA(h: number, s: number, v: number, a?: number) : Color`
- `persist(instance: SpriteInstance, level: number = 1)`
- `tag(instance: SpriteInstance, tagName: string)`
- `untag(instance: SpriteInstance, tagName: string)`
- `drandom() : number`
- `drandomSetSeed(seed: string)`
- `getCanvas2DContext() : CanvasRenderingContext2D`
- `openRemixMenu()`

## other stuff

[read disclaimer](disclaimer)