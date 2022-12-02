import Room from "../structs/room";
import Sprite from "../structs/sprite";
import type ResourceManager from "./ResourceManager";
import Renderer from "./renderer"
import { mod, xorshiftGetRandom01, xorshiftSetSeed } from "./utils";
import type Instance from "../structs/instance";

export interface SpriteInstance {
    x: number,
    y: number,
    imgScaleX: number,
    imgScaleY: number,
    imgRotation: number,
    imgAlpha: number,

    spriteID: string,
    update: Function,
}


const ALL_UUID = "ddf24ad7-6386-4f3e-80a1-a7f18eb01aba";
const NOONE_UUID = "a33e372b-c773-4a10-9106-83bae17c9626";

export default class Game {
    tickRate: number;
    resourceManager: ResourceManager;
    canvas: HTMLCanvasElement;
    tickNumber: number;
    isEnding: boolean;
    currentRoom: Room
    queuedRoom: Room

    instances: SpriteInstance[];
    renderer: Renderer;

    mouseX: number
    mouseY: number

    keyMap: Map<string, boolean>
    keyMapSnapshot: Map<string, boolean>
    pressedMap: Map<string, boolean>
    releasedMap: Map<string, boolean>

    
    persistent: WeakMap<SpriteInstance, number>
    instanceSets: Map<string, WeakSet<SpriteInstance>>
    upForDeletion: WeakSet<SpriteInstance>
    instanceArrays: WeakMap<Room, SpriteInstance[]>
    instanceSpriteInstanceMap: WeakMap<Instance, SpriteInstance>

    instanceDepth: WeakMap<SpriteInstance, number>


    constructor(resourceManager: ResourceManager, canvas: HTMLCanvasElement) {
        this.tickRate = 60;
        this.resourceManager = resourceManager;
        this.canvas = canvas;
        this.tickNumber = 0;
        this.instances = [];
        this.isEnding = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.persistent = new WeakMap();
        this.instanceSets = new Map();
        this.upForDeletion = new WeakSet();
        this.instanceArrays = new WeakMap();
        this.instanceSpriteInstanceMap = new WeakMap();
        
        this.currentRoom = null;
        this.queuedRoom = null;
        

        this.keyMap = new Map<string, boolean>();
        this.keyMapSnapshot = new Map<string, boolean>();
        this.pressedMap = new Map<string, boolean>();
        this.releasedMap = new Map<string, boolean>();

        // extra instance info
        this.instanceDepth = new WeakMap<SpriteInstance, number>()

        this.renderer = new Renderer(canvas, resourceManager);

        // safety to combat problems with hot-reloading in development
        if(window["_game"]) window["_game"].quit()
        window["_game"] = this;
        
        // TODO weird and hacky
        // window.setTimeout(() => this.init(), 10);
        this.init();
    }

    async init() {
        // compile custom code
        for(let sprite of this.resourceManager.getSprites()) {
            // always true
            if(sprite instanceof Sprite) {
                // sprite._initFunction = new Function(sprite.initCode);
                // sprite._updateFunction = new Function(sprite.updateCode);
                sprite.generateCode();
            }
            this.instanceSets.set(sprite.uuid, new WeakSet());
        }

        // special sets
        this.instanceSets.set(ALL_UUID, new WeakSet());
        this.instanceSets.set(NOONE_UUID, new WeakSet());

        // make resource accesors

        for (const resource of this.resourceManager.resources.values()) {
            // accessing a sprite by name, will try to return an instance of that sprite 
            Object.defineProperty(window, resource.name, {
                configurable: true,
                writable: false,
                value: resource.uuid,
            })
        }

        defineLibProperty("roomWidth", () => this.currentRoom?.width);
        defineLibProperty("roomHeight", () => this.currentRoom?.height);
        defineLibProperty("mouseX", () => this.mouseX);
        defineLibProperty("mouseY", () => this.mouseY);
        defineLibProperty("all", () => ALL_UUID);
        defineLibProperty("noone", () => NOONE_UUID);
        defineLibProperty("currentRoom", () => this.currentRoom.uuid);

        defineLibFunction("spawn", (sprite: string, x: number, y: number): SpriteInstance => this.createInstance(sprite, x, y))
        defineLibFunction("destroyImmediate", (instance: SpriteInstance) => this.destroyInstance(instance))
        defineLibFunction("destroy", (instance: SpriteInstance) => this.upForDeletion.add(instance))
        defineLibFunction("find", (filter: string) => {
            const ws = this.instanceSets.get(filter);
            return this.instances.find(x => ws.has(x))
        });
        defineLibFunction("findAll", (filter: string) => {
            const ws = this.instanceSets.get(filter);
            return this.instances.filter(x => ws.has(x))
        });
        defineLibFunction("setDepth", (self: SpriteInstance, depth: number) => {
            this.instanceDepth.set(self, depth);
        })
        defineLibFunction("goToNextRoom", () => this.moveRoom(+1) )
        defineLibFunction("goToPreviousRoom", () => this.moveRoom(-1) )
        defineLibFunction("goToRoom", (roomID: string) => this.setRoom(roomID) )
        defineLibFunction("moveRooms", (difference: number) => this.moveRoom(difference) )
        
        defineLibFunction("nameOf", (uuid: string) => this.resourceManager.getResource(uuid).name )
        
        defineLibFunction("keyIsDown", (...codes: string[]) => this.checkKeys("down", ...codes) )
        defineLibFunction("keyIsPressed", (...codes: string[]) => this.checkKeys("pressed", ...codes) )
        defineLibFunction("keyIsReleased", (...codes: string[]) => this.checkKeys("released", ...codes) )
        
        defineLibFunction("collisionAt", (instance: SpriteInstance, filter: string, x: number, y: number) => this.collisionAt(instance, filter, x, y) )
        defineLibFunction("lerp", (a: number, b: number, factor: number) => a*(1-factor) + b*factor )
        defineLibFunction("instancesAt", (instance: SpriteInstance, filter: string, x: number, y: number) => Array.from(this._iterateCollisionsAt(instance, filter, x, y)))
        
        defineLibFunction("persist", (instance: SpriteInstance, level: number = 1) => this.persistent.set(instance, level))

        defineLibFunction("tag", (instance: SpriteInstance, tagName: string) => {
            if(!this.instanceSets.has(tagName)) 
                this.instanceSets.set(tagName, new WeakSet())
            let ws = this.instanceSets.get(tagName);
            ws.add(instance);
        })

        defineLibFunction("drandom", () => xorshiftGetRandom01());
        defineLibFunction("drandomSetSeed", (seed: string) => xorshiftSetSeed(seed));

        window.onkeydown = (event: KeyboardEvent) => {
            // keys.set(event.key, true);
            this.keyMap.set(event.code, true);
            return false;
        };
        window.onkeyup = (event: KeyboardEvent) => {
            // keys.set(event.key, true);
            this.keyMap.set(event.code, false);
            return false;
        };

        window.onmousemove = (ev: MouseEvent) => {
            this.mouseX = ev.offsetX * devicePixelRatio;
            this.mouseY = ev.offsetY * devicePixelRatio;
        }

        let rooms = this.resourceManager.getRooms();
        if(rooms.length == 0) {
            console.warn("no rooms found. Possibly a side effect of invalid/missing game data.")
        } else { 
            this._setRoomDirect(rooms[0]);

            // start
            this.mainLoop();
        }
    }

    async mainLoop() {
        while(!this.isEnding) {
            await new Promise(resolve => window.requestAnimationFrame(() => { this.update(); resolve(null) }));
        }
    }

    checkKeys(mode: "down" | "pressed" | "released", ...codes: string[]) {
        let map = 
            mode == "pressed"? this.pressedMap : (mode == "released"? this.releasedMap: this.keyMap)
        for(let code of codes) {
            if(map.has(code) && map.get(code)) {
                return true;
            }
        } 
        return false;
    }

    createInstance(spriteUUID: string, x: number, y: number) {
        // const inst = new Instance(spriteUUID, x, y);
        const sprite = this.resourceManager.getResource(spriteUUID) as Sprite;
        const inst = sprite._instanceConstructor(x, y);
        // inst.x = x;
        // inst.y = y;
        this.instances.push(inst)
        this.instanceSets.get(ALL_UUID).add(inst);
        this.instanceSets.get(inst.spriteID)?.add(inst);

        return inst;
    }

    destroyInstance(instance: SpriteInstance) {
        let instID = this.instances.indexOf(instance);
        if(instID >= 0) this.instances.splice(instID, 1);
    }

    collisionAt(instance: SpriteInstance, filter: string, x: number, y: number): boolean {
        const ws = this.instanceSets.get(filter);
        if(!ws) return false;

        for(let other of this.instances) {
            if(other != instance && ws.has(other)) {
                if(this.spriteIntersect(instance.spriteID, x, y, other.spriteID, other.x, other.y)) {
                    return true;
                }
            }
        }
        return false;
    }

    * _iterateCollisionsAt(instance: SpriteInstance, filter: string, x: number, y: number) {
        const ws = this.instanceSets.get(filter);
        if(!ws) return false;

        for(let other of this.instances) {
            if(other != instance && ws.has(other)) {
                if(this.spriteIntersect(instance.spriteID, x, y, other.spriteID, other.x, other.y)) {
                    yield other;
                }
            }
        }
    }

    spriteIntersect(sprID1: string, x1: number, y1: number, sprID2: string, x2: number, y2: number): boolean {
        const spr1 = this.resourceManager.getResource(sprID1) as Sprite;
        const spr2 = this.resourceManager.getResource(sprID2) as Sprite;
    
        const inst1Left = x1 - spr1.originX + spr1.bBoxX;
        const inst1Right = inst1Left + spr1.bBoxWidth;
        const inst1Top = y1 - spr1.originY + spr1.bBoxY;
        const inst1Bottom = inst1Top + spr1.bBoxHeight;

        const inst2Left = x2 - spr2.originX + spr2.bBoxX;
        const inst2Right = inst2Left + spr2.bBoxWidth;
        const inst2Top = y2 - spr2.originY + spr2.bBoxY;
        const inst2Bottom = inst2Top + spr2.bBoxHeight;
        
        return inst1Left < inst2Right && inst1Right > inst2Left &&
            inst1Top < inst2Bottom && inst1Bottom > inst2Top;
    }

    // instanceIntersect(inst1: SpriteInstance, inst2: SpriteInstance): boolean {
    //     const spr1 = this.resourceManager.getResource(inst1.spriteID) as Sprite;
    //     const spr2 = this.resourceManager.getResource(inst2.spriteID) as Sprite;
    //     ...
    // }

    moveRoom(delta: number) {
        let rooms = this.resourceManager.getRooms();
        let currentID = rooms.indexOf(this.currentRoom);
        if(currentID < 0) return;
        let newID = mod(currentID + delta, rooms.length);
        
        this.queuedRoom = rooms[newID]; 
    }

    setRoom(roomUUID: string) {
        let room = this.resourceManager.getResourceOfType(roomUUID, Room) as Room;
        if(!room) return;
        this.queuedRoom = room;
    }

    _setRoomDirect(room: Room) {
        this.currentRoom = room;
        this.canvas.width = room.width;
        this.canvas.height = room.height;

        document.body.style.backgroundColor = room.backgroundColor;

        // go through room instances
        // for each one: either recreate (default) or re-use(persistent)
        // superpersistent instances are also moved to next room

        // keep persistence level 2 instances
        this.instances = this.instances.filter(x => this.persistent.get(x) >= 2);

        xorshiftSetSeed(room.uuid);
        // xorshiftSetSeed(0);

        for(let roomInst of room.instances) {
            let existing = this.instanceSpriteInstanceMap.get(roomInst);
            let pLevel = (existing && this.persistent.get(existing)) || 0;

            // persistence level 0 are respawned, level 1 instances are reused
            if(!existing || pLevel <= 0) {
                // respawned
                let inst = this.createInstance(roomInst.spriteID, roomInst.x, roomInst.y)
                this.instanceSpriteInstanceMap.set(roomInst, inst);
            } else
            if(pLevel == 1) {
                // reuse
                this.instances.push(existing);
            }
        }
    }

    _registerInstance(inst: SpriteInstance) {
        let sprite = this.resourceManager.getResource(inst.spriteID) as Sprite;
        // if(!sprite || !sprite.canvas) return;
    }

    quit() {
        // clean up
        this.isEnding = true;
    }

    update() {
        for(let [key, value] of this.keyMap) {
            const previous = this.keyMapSnapshot.has(key) && this.keyMapSnapshot.get(key);
            this.pressedMap.set(key, !previous && value);
            this.releasedMap.set(key, previous && !value);
            this.keyMapSnapshot.set(key, value);
        }

        for(let inst of this.instances) {
            inst.update(inst);
        }

        for(let inst of this.instances) {
            if(this.upForDeletion.has(inst))
                this.destroyInstance(inst);
        }

        // this.draw();
        this.instances.sort((a, b) => 
            this.instanceDepth.get(a) || 0 -
            this.instanceDepth.get(b) || 0
        )
        this.renderer.render(this.instances);

        // change rooms
        if(this.queuedRoom != null) {
            this._setRoomDirect(this.queuedRoom);
            this.queuedRoom = null;
        }
        
        this.tickNumber ++;

    }

    // draw() {
    //     let room = this.currentRoom();
    //     if(!room) return;
        
    //     let ctx = this.canvas?.getContext("2d")!;
    //     if(!ctx) return;

    //     // ctx.clearRect(0, 0, room.width, room.height);
    //     ctx.fillStyle = room.backgroundColor;
    //     ctx.fillRect(0, 0, room.width, room.height);

    //     room.filterInstances(); // TODO kind of unnecessary work

    //     for(let inst of this.instances) {
    //         inst.draw(ctx);
    //     }

    //     ctx.fillStyle = "white";
    //     ctx.textAlign = "left";
    //     ctx.textBaseline = "top";
    //     ctx.fillText(`${this.tickNumber}`, 5, 5);
    // }
}

function defineLibFunction(name: string, func: Function) {
    Object.defineProperty(window, name, {
        configurable: true,
        writable: false,
        value: func,
    })
}

function defineLibProperty(name: string, getter: () => any, setter: () => any = undefined) {
    let config: PropertyDescriptor = {
        configurable: true,
        get: getter,
    };
    if(setter) config.set = setter;
    
    Object.defineProperty(window, name, config);
}