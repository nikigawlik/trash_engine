import type Instance from "../structs/instance";
import Room from "../structs/room";
import SoundEffect from "../structs/soundEffect";
import Sprite from "../structs/sprite";
import Renderer from "./renderer";
import type ResourceManager from "./ResourceManager";
import { Color, getColorHSVA, getColorRGBA, mod, xorshiftGetRandom01, xorshiftSetSeed } from "./utils";

let animFrameHandle: number|undefined = undefined;

if(import.meta.hot) {
    import.meta.hot.dispose(data => {
        window.cancelAnimationFrame(animFrameHandle);
    })
}

export interface SpriteInstance {
    x: number,
    y: number,
    imgScaleX: number,
    imgScaleY: number,
    imgRotation: number,
    imgAlpha: number,
    imgColor: Color,

    spriteID: string,
    update: Function,
}


const ALL_UUID = "ddf24ad7-6386-4f3e-80a1-a7f18eb01aba";
const NOONE_UUID = "a33e372b-c773-4a10-9106-83bae17c9626";

export default class Game {
    tickRate: number;
    resourceManager: ResourceManager;
    canvasWebgl: HTMLCanvasElement;
    canvas2d: HTMLCanvasElement;
    htmlOverlay: HTMLElement

    tickNumber: number;
    isEnding: boolean;
    currentRoom: Room
    queuedRoom: Room
    startRoom: Room


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
    destroyed: WeakSet<SpriteInstance>
    instanceArrays: WeakMap<Room, SpriteInstance[]>
    
    instanceSpriteInstanceMap: WeakMap<Instance, SpriteInstance>
    
    instanceDepth: WeakMap<SpriteInstance, number>
    editorCallback: (() => void) | null
    quitGameCallback: (() => void) | null
    errorCallback: ((e: Error) => Promise<boolean>) | null


    constructor(resourceManager: ResourceManager, canvasWebGL: HTMLCanvasElement, canvas2d: HTMLCanvasElement, htmlOverlay: HTMLDivElement, startRoomID?: string) {
        this.tickRate = 60;
        this.resourceManager = resourceManager;
        this.editorCallback = null;

        this.canvasWebgl = canvasWebGL;
        this.canvas2d = canvas2d;
        this.htmlOverlay = htmlOverlay;
        this.tickNumber = 0;
        this.instances = [];
        this.isEnding = false;
       
        this.mouseX = 0;
        this.mouseY = 0;

        this.persistent = new WeakMap();
        this.instanceSets = new Map();
        this.destroyed = new WeakSet();
        this.instanceArrays = new WeakMap();
        this.instanceSpriteInstanceMap = new WeakMap();
        
        this.currentRoom = null;
        this.queuedRoom = null;
        this.startRoom = startRoomID && this.resourceManager.getResourceOfType(startRoomID, Room) as Room;

        if(!this.startRoom) {
            let rooms = this.resourceManager.getRooms();
            
            if(rooms.length == 0) {
                console.warn("no rooms found. Possibly a side effect of invalid/missing game data.")
            } else {
                this.startRoom = rooms[0]
            }
        }
        

        this.keyMap = new Map<string, boolean>();
        this.keyMapSnapshot = new Map<string, boolean>();
        this.pressedMap = new Map<string, boolean>();
        this.releasedMap = new Map<string, boolean>();

        // extra instance info
        this.instanceDepth = new WeakMap<SpriteInstance, number>()

        this.renderer = new Renderer(canvasWebGL, resourceManager);

        // safety to combat problems with hot-reloading in development
        if(window["_game"]) window["_game"].quit()
        window["_game"] = this;
        
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

        // render sfx IS DONE ASYNC (not waiting)

        (async () => {
            await new Promise( resolve => {
                window.addEventListener("mousedown", resolve);
                window.addEventListener("touchstart", resolve);
                window.addEventListener("keydown", resolve);
            });

            SoundEffect.init();

            for(let soundEffect of this.resourceManager.getSoundEffects()) {
                soundEffect.createBuffer();
            }
        })();

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
        
        defineLibProperty("overlayText", 
            () => this.htmlOverlay.textContent, 
            (text: string) => { this.htmlOverlay.textContent = text}
        );

        defineLibFunction("spawn", (sprite: string, x: number, y: number): SpriteInstance => this.createInstance(sprite, x, y))
        defineLibFunction("destroyImmediate", (instance: SpriteInstance) => this.destroyInstance(instance))
        defineLibFunction("destroy", (instance: SpriteInstance) => {
            if(!instance) return false;
            this.destroyed.add(instance);
            return true;
        })
        defineLibFunction("find", (filter: string) => {
            const ws = this.instanceSets.get(filter);
            return this.instances.find(x => ws.has(x))
        });
        defineLibFunction("findAll", (filter: string) => {
            const ws = this.instanceSets.get(filter);
            return this.instances.filter(x => ws.has(x))
        });
        defineLibFunction("findClosest", (filter: string, x: number, y: number) => {
            const ws = this.instanceSets.get(filter);
            let closest = null;
            let closestDistSqr = Infinity;
            for(let inst of this.instances) {
                if(!ws.has(inst)) continue;
                const distSqr = (inst.x - x)**2 + (inst.y - y)**2;
                if(distSqr <= closestDistSqr) {
                    closestDistSqr = distSqr;
                    closest = inst 
                }
            }
            return closest;
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
        defineLibFunction("instancesAt", (instance: SpriteInstance, filter: string, x: number, y: number) => Array.from(this._iterateCollisionsAt(instance, filter, x, y)))
        
        defineLibFunction("lerp", (a: number, b: number, factor: number) => a*(1-factor) + b*factor )
        defineLibFunction("approach", (a: number, b: number, speed: number) => 
        a + Math.sign(b - a) * Math.min(speed, Math.abs(b-a))
        )
        defineLibFunction("distance", (x1: number, y1: number, x2: number, y2: number) => 
            ((x1-x2)**2 + (y1-y2)**2)**0.5 
        )

        defineLibFunction("colorRGBA", getColorRGBA)
        defineLibFunction("colorHSVA", getColorHSVA)
        
        defineLibFunction("persist", (instance: SpriteInstance, level: number = 1) => this.persistent.set(instance, level))
        defineLibFunction("tag", (instance: SpriteInstance, tagName: string) => {
            if(!this.instanceSets.has(tagName)) 
                this.instanceSets.set(tagName, new WeakSet())
            let ws = this.instanceSets.get(tagName);
            ws.add(instance);
        })

        defineLibFunction("untag", (instance: SpriteInstance, tagName: string) => {
            if(!this.instanceSets.has(tagName)) 
                return;
            let ws = this.instanceSets.get(tagName);
            ws.delete(instance);
        })

        defineLibFunction("drandom", () => xorshiftGetRandom01());
        defineLibFunction("drandomSetSeed", (seed: string) => xorshiftSetSeed(seed));

        defineLibFunction("getCanvas2DContext", () => this.canvas2d.getContext("2d"));

        defineLibFunction("openRemixMenu", () => this.requestOpenEditor());
        defineLibFunction("endGame", () => this.quit());

        defineLibFunction("playSound", (soundID: string, gain: number = 1.0, detune = 0) => {
            let sfx = this.resourceManager.getResourceOfType(soundID, SoundEffect) as SoundEffect;
            if(sfx) {
                sfx.play(gain, detune);
            }
        });

        window.onmousedown = () => {
        }

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

        if(this.startRoom) {
            this._setRoomDirect(this.startRoom);
            
            // start
            this.mainLoop();
        }
        
    }

    async mainLoop() {
        let lastFrame = Date.now();
        let minimumTimeBetweenFrames = 1000/70; // 70 fps delta

        while(!this.isEnding) {
            await new Promise(resolve => animFrameHandle = window.requestAnimationFrame(() => { 
                resolve(null); 
            }));
            const now = Date.now();
            const delta = now - lastFrame;
            // if the game runs quicker than 70fps, we start skipping frames
            // 70, so that we have some buffer, most machines should be 60, some 120, etc.
            if(delta > minimumTimeBetweenFrames) {
                await this.update(); 
                lastFrame = now;
            }
        }
        if(this.quitGameCallback) this.quitGameCallback();
    }

    registerEditorCallback(callback: () => void) {
        this.editorCallback = callback;
    }

    requestOpenEditor() {
        this.editorCallback();
    }

    checkKeys(mode: "down" | "pressed" | "released", ...codes: string[]) {
        let map = 
            mode == "pressed"? this.pressedMap : (mode == "released"? this.releasedMap: this.keyMap)

        for(let code of codes) {
            if(code == "KeyAny") {
                if(Array.from(map.values()).includes(true)) {
                    return true;
                }
            } else
            if(map.has(code) && map.get(code)) {
                return true;
            }
        } 
        return false;
    }

    createInstance(spriteUUID: string, x: number, y: number) {
        // const inst = new Instance(spriteUUID, x, y);
        const sprite = this.resourceManager.getResource(spriteUUID) as Sprite;
        if(!sprite._instanceConstructor) throw Error(`Compiler error in ${sprite.name}`);
        const inst = sprite._instanceConstructor(x, y);
        if(!inst) return;
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
        this.canvasWebgl.width = room.width;
        this.canvasWebgl.height = room.height;

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
            // don't respawn permanently destroyed instances
            if(existing && this.persistent.has(existing) && this.persistent.get(existing) > 0 && this.destroyed.has(existing)) {
                continue;
            }
            let pLevel = (existing && this.persistent.get(existing)) || 0;

            // persistence level 0 are respawned, level 1 instances are reused
            if(!existing || pLevel <= 0) {
                // respawned
                try {
                    let inst = this.createInstance(roomInst.spriteID, roomInst.x, roomInst.y)
                    this.instanceSpriteInstanceMap.set(roomInst, inst);
                } catch(e) {
                    this.handleError(e);
                }
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

    async handleError(e: Error) {
        if(this.errorCallback) {
            let abort = await this.errorCallback(e);
            if(abort) {
                this.quit();
            }
            console.error(e);
        } else {
            // do nothing
            console.error(e);
            this.quit();
        }
    }

    async update() {
        // set up keyboard stuff
        for(let [key, value] of this.keyMap) {
            const previous = this.keyMapSnapshot.has(key) && this.keyMapSnapshot.get(key);
            this.pressedMap.set(key, !previous && value);
            this.releasedMap.set(key, previous && !value);
            this.keyMapSnapshot.set(key, value);
        }
        
        // clear 2d canvas
        this.canvas2d.getContext("2d").clearRect(0, 0, this.canvas2d.width, this.canvas2d.height);

        // update instances
        for(let inst of this.instances) {
            // generic try catch, so that game doesn't break at small error
            try {
                inst.update(inst);
            } catch(e) {
                await this.handleError(e);
            }
        }

        // destroy instances
        for(let inst of this.instances) {
            if(this.destroyed.has(inst))
                this.destroyInstance(inst);
        }

        // sort by depth
        this.instances.sort((a, b) => 
            (this.instanceDepth.get(a) || 0) -
            (this.instanceDepth.get(b) || 0)
        )

        // render!
        this.renderer.render(this.instances);

        // change rooms
        if(this.queuedRoom != null) {
            this._setRoomDirect(this.queuedRoom);
            this.queuedRoom = null;
        }
        
        this.tickNumber ++;
    }
}

function defineLibFunction(name: string, func: Function) {
    Object.defineProperty(window, name, {
        configurable: true,
        writable: false,
        value: func,
    })
}

function defineLibProperty(name: string, getter: () => any, setter: (value: any) => void = undefined) {
    let config: PropertyDescriptor = {
        configurable: true,
        get: getter,
    };
    if(setter) config.set = setter;
    
    Object.defineProperty(window, name, config);
}