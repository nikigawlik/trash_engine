## how do I code???? ##

You go to a sprite. Then click script > add behaviour > custom code.

Open the newly created behaviour and start writing code (JavaScript).

## quick reference of functions & props for scripting

Your sprite has some built-in variables you can just access:

- `x`, `y`,
- `spriteID`,
- `imgScaleX`, `imgScaleY`,
- `imgAlpha`,
- `imgColor`
- `me`

To get a reference to the sprite instance (the thing placed in the room) use `me`.

To get a reference to a different thing in the room, you can use a function like `find(...)`, `findAll(...)`, `findClosest(...)` or `instancesAt(...)`.


```
let b = find(ball); // ball is the name of a sprite
b.x = 100;

for(let other of instancesAt(me, wall, x, y)) {
    destroy(other);
}
```

When a function requires a `string (uuid)` just pass the name of the sprite like `player`, this is a global variable containing the id of the sprite.

When a function requires a `SpriteInstance` this is a specific instance of a sprite in the room, like mentioned above.

Below there is a list of all global functions and properties, which are hopefully mostly self-explanatory:

In the future there will be documentation for every function, but not right now, sorry!

(Properties are read-only unless otherwise specified.)

- `roomWidth : number`
- `roomHeight : number`
- `mouseX : number`
- `mouseY : number`
- `cameraX : number  (settable)`
- `cameraY : number  (settable)`
- `all : string (uuid)`
- `noone : string (uuid)`
- `currentRoom : string (uuid)`
- `overlayText: string   (settable)`

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
- `playSound(soundID: string, gain: number = 1.0)`

## other stuff

[read disclaimer](disclaimer)