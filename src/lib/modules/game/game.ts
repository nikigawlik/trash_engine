import * as pixi from 'pixi.js';
import type Room from "../structs/room";
import Sprite from "../structs/sprite";
import type ResourceManager from "./ResourceManager";
import Renderer from "./renderer"

export interface SpriteInstance {
    x: number,
    y: number,
    spriteID: string,
    pixiSprite: pixi.Sprite,
    update: Function,
}


const ALL_UUID = "ddf24ad7-6386-4f3e-80a1-a7f18eb01aba";
const NOONE_UUID = "a33e372b-c773-4a10-9106-83bae17c9626";

export default class Game {
    tickRate: number;
    currentRoomUUID: string;
    resourceManager: ResourceManager;
    _cachedRoom: Room|null;
    canvas: HTMLCanvasElement;
    tickNumber: number;
    isEnding: boolean;

    instances: SpriteInstance[];
    renderer: Renderer;
    stage: pixi.Container;

    mouseX: number
    mouseY: number

    roomNumber: number
    actualRoomNumber: number

    keyMap: Map<string, boolean>
    keyMapSnapshot: Map<string, boolean>
    pressedMap: Map<string, boolean>
    releasedMap: Map<string, boolean>

    upForDeletion: WeakSet<SpriteInstance>

    persistent: WeakSet<SpriteInstance>
    instanceSets: Map<string, WeakSet<SpriteInstance>>

    constructor(resourceManager: ResourceManager, canvas: HTMLCanvasElement) {
        this.tickRate = 60;
        this.currentRoomUUID = ""; // actually set later using setRoom
        this.resourceManager = resourceManager;
        this.canvas = canvas;
        this._cachedRoom = null;
        this.tickNumber = 0;
        this.instances = [];
        this.isEnding = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.roomNumber = 0;
        this.actualRoomNumber = 0;
        this.persistent = new WeakSet();
        this.instanceSets = new Map();
        this.upForDeletion = new WeakSet();
        
        this.keyMap = new Map<string, boolean>();
        this.keyMapSnapshot = new Map<string, boolean>();
        this.pressedMap = new Map<string, boolean>();
        this.releasedMap = new Map<string, boolean>();

        // this.renderer = new pixi.Renderer({
        //     view: canvas,
        //     autoDensity: false,
        //     antialias: false,
        // });
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

        for (const resource of this.resourceManager._resources.values()) {
            // accessing a sprite by name, will try to return an instance of that sprite 
            Object.defineProperty(window, resource.name, {
                configurable: true,
                writable: false,
                value: resource.uuid,
            })
        }

        defineLibProperty("roomWidth", () => this._cachedRoom?.width);
        defineLibProperty("roomHeight", () => this._cachedRoom?.height);
        defineLibProperty("mouseX", () => this.mouseX);
        defineLibProperty("mouseY", () => this.mouseY);
        defineLibProperty("all", () => ALL_UUID);
        defineLibProperty("noone", () => NOONE_UUID);

        defineLibFunction("spawn", (sprite: string, x: number, y: number): SpriteInstance => this.createInstance(sprite, x, y))
        defineLibFunction("destroyImmediate", (instance: SpriteInstance) => this.destroyInstance(instance))
        defineLibFunction("destroy", (instance: SpriteInstance) => this.upForDeletion.add(instance))
        defineLibFunction("find", (sprite: string) => this.instances.find(x => x.spriteID == sprite))
        defineLibFunction("findAll", (sprite: string) => this.instances.filter(x => x.spriteID == sprite))
        defineLibFunction("setDepth", (self: SpriteInstance, depth: number) => {
            if(self.pixiSprite) self.pixiSprite.zIndex = depth;
        })
        defineLibFunction("goToNextRoom", () => {
            this.roomNumber++;
        })
        defineLibFunction("goToPreviousRoom", () => {
            this.roomNumber--;
        })
        defineLibFunction("moveRooms", (difference: number) => {
            this.roomNumber += difference;
        })
        defineLibFunction("keyIsDown", (...codes: string[]) => this.checkKeys("down", ...codes) )
        defineLibFunction("keyIsPressed", (...codes: string[]) => this.checkKeys("pressed", ...codes) )
        defineLibFunction("keyIsReleased", (...codes: string[]) => this.checkKeys("released", ...codes) )
        
        defineLibFunction("collisionAt", (instance: SpriteInstance, filter: string, x: number, y: number) => this.collisionAt(instance, filter, x, y) )
        defineLibFunction("lerp", (a: number, b: number, factor: number) => a*(1-factor) + b*factor )
        defineLibFunction("instancesAt", (instance: SpriteInstance, filter: string, x: number, y: number) => Array.from(this._iterateCollisionsAt(instance, filter, x, y)))
        
        defineLibFunction("persist", (instance: SpriteInstance) => this.persistent.add(instance))
        defineLibFunction("tag", (instance: SpriteInstance, tagName: string) => {
            if(!this.instanceSets.has(tagName)) 
                this.instanceSets.set(tagName, new WeakSet())
            let ws = this.instanceSets.get(tagName);
            ws.add(instance);
        })

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
            this.setRoom(rooms[this.roomNumber].uuid);

            // start
            this.update();
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
        this.instances.push(inst)
        this._registerInstance(inst);
        // inst.create();
        return inst;
    }

    destroyInstance(instance: SpriteInstance) {
        let instID = this.instances.indexOf(instance);
        if(instID >= 0) this.instances.splice(instID, 1);
        if(instance.pixiSprite) this.stage.removeChild(instance.pixiSprite);
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

    setRoom(roomUUID: string) {
        this.currentRoomUUID = roomUUID;
        const room = this.currentRoom();
        // this.renderer.resize(room.width, room.height)
        this.canvas.width = room.width;
        this.canvas.height = room.height;

        let bgC = room.backgroundColor;
        if(bgC.length == 4) {
            bgC = "#" + bgC.slice(1).split("").map(x => x+x).join("");
        }
        console.log(`${room.backgroundColor} -> ${bgC}`);
        this.renderer.backgroundColor = pixi.utils.string2hex(bgC);
        // console.log(`${room.backgroundColor} -> ${pixi.utils.string2hex(room.backgroundColor)}`)

        // TODO kinda hacky
        document.body.style.backgroundColor = room.backgroundColor;

        if(this.stage) this.stage.removeChildren()
        else this.stage = new pixi.Container();

        // this.instances = room.instances.map(i => i.clone());
        // this.instances = room.instances.map(i => {
        //     let sprite = this.resourceManager.getResource(i.spriteID) as Sprite;
        //     return sprite._instanceConstructor(i.x, i.y);
        // })

        this.instances = this.instances.filter(x => this.persistent.has(x));

        // re-register persistent instances
        for(let inst of this.instances) {
            this._registerInstance(inst)
        }

        for(let roomInst of room.instances) {
            this.createInstance(roomInst.spriteID, roomInst.x, roomInst.y)
        }
    }

    _registerInstance(inst: SpriteInstance) {
        let sprite = this.resourceManager.getResource(inst.spriteID) as Sprite;
        // if(!sprite || !sprite.canvas) return;

        this.instanceSets.get(ALL_UUID).add(inst);
        this.instanceSets.get(inst.spriteID)?.add(inst);

        let pixiSpr = pixi.Sprite.from(sprite.canvas);
        pixiSpr.x = inst.x;
        pixiSpr.y = inst.y;
        pixiSpr.pivot.set(sprite.originX, sprite.originY);
        this.stage.addChild(pixiSpr);
        inst.pixiSprite = pixiSpr;
    }

    currentRoom() : Room {
        if(!this._cachedRoom || this._cachedRoom.uuid != this.currentRoomUUID) {
            this._cachedRoom = this.resourceManager.getResource(this.currentRoomUUID) as Room;
        }
        return this._cachedRoom;
    }

    quit() {
        // clean up
        this.isEnding = true;
    }

    update() {
        if(this.roomNumber != this.actualRoomNumber) {
            let allRooms = this.resourceManager.getRooms();
            this.roomNumber = this.roomNumber % allRooms.length;
            this.actualRoomNumber = this.roomNumber;
            this.setRoom(allRooms[this.actualRoomNumber].uuid);
        }
 
        for(let [key, value] of this.keyMap) {
            const previous = this.keyMapSnapshot.has(key) && this.keyMapSnapshot.get(key);
            this.pressedMap.set(key, !previous && value);
            this.releasedMap.set(key, previous && !value);
            this.keyMapSnapshot.set(key, value);
        }

        for(let inst of this.instances) {
            inst.update(inst);
            inst.pixiSprite.x = inst.x;
            inst.pixiSprite.y = inst.y;
        }

        for(let inst of this.instances) {
            if(this.upForDeletion.has(inst))
                this.destroyInstance(inst);
        }

        // this.draw();
        this.stage.sortChildren();
        this.renderer.render(this.instances);
        
        this.tickNumber ++;
        if(!this.isEnding) window.requestAnimationFrame(() => this.update());
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