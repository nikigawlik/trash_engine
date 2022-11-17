import Room from "../structs/room";
import type ResourceManager from "./ResourceManager";
import * as pixi from 'pixi.js';
import Sprite from "../structs/sprite";

interface SpriteInstance {
    x: number,
    y: number,
    spriteID: string,
    pixiSprite: pixi.Sprite,
    update: Function,
}

export default class Game {
    tickRate: number;
    currentRoomUUID: string;
    resourceManager: ResourceManager;
    _cachedRoom: Room|null;
    canvas: HTMLCanvasElement;
    tickNumber: number;
    isEnding: boolean;

    instances: SpriteInstance[];
    renderer: pixi.Renderer;
    stage: pixi.Container;

    mouseX: number
    mouseY: number

    roomNumber: number
    actualRoomNumber: number

    keyMap: Map<string, boolean>
    keyMapSnapshot: Map<string, boolean>
    pressedMap: Map<string, boolean>
    releasedMap: Map<string, boolean>


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
        
        this.keyMap = new Map<string, boolean>();
        this.keyMapSnapshot = new Map<string, boolean>();
        this.pressedMap = new Map<string, boolean>();
        this.releasedMap = new Map<string, boolean>();

        this.renderer = new pixi.Renderer({
            view: canvas,
            autoDensity: false,
            antialias: false,
        });
        
        // TODO weird and hacky
        // window.setTimeout(() => this.init(), 10);
        this.init();
    }

    async init() {
        // compile custom code
        for(let sprite of this.resourceManager.getAllOfResourceType(Sprite)) {
            // always true
            if(sprite instanceof Sprite) {
                // sprite._initFunction = new Function(sprite.initCode);
                // sprite._updateFunction = new Function(sprite.updateCode);
                sprite.generateCode();
            }
        }

        // make resource accesors

        for (const resource of this.resourceManager.root.iterateAllResources()) {
            // accessing a sprite by name, will try to return an instance of that sprite 
            Object.defineProperty(window, resource.name, {
                configurable: true,
                writable: false,
                value: resource.uuid,
            })
        }

        // for (const sprite of this.resourceManager.getAllOfResourceType(Sprite)) {
        //     // accessing a sprite by name, will try to return an instance of that sprite 
        //     Object.defineProperty(window, sprite.name, {
        //         get: () => self.instances.find(x => x.spriteID == sprite.uuid),
        //         configurable: true,
        //     })
        // }

        // for (const room of this.resourceManager.getAllOfResourceType(Room)) {
        //     // accessing a sprite by name, will try to return an instance of that sprite 
        //     Object.defineProperty(window, room.name, {
        //         get: () => room,
        //         configurable: true,
        //     })
        // }

        Object.defineProperty(window, "roomWidth", {
            configurable: true,
            get: () => this._cachedRoom?.width,
        })

        Object.defineProperty(window, "roomHeight", {
            configurable: true,
            get: () => this._cachedRoom?.height,
        })

        Object.defineProperty(window, "mouseX", {
            configurable: true,
            get: () => this.mouseX,
        })

        Object.defineProperty(window, "mouseY", {
            configurable: true,
            get: () => this.mouseY,
        })

        Object.defineProperty(window, "spawn", {
            configurable: true,
            writable: false,
            value: (sprite: string, x: number, y: number): SpriteInstance => this.createInstance(sprite, x, y),
        })

        Object.defineProperty(window, "destroy", {
            configurable: true,
            writable: false,
            value: (instance: SpriteInstance) => this.destroyInstance(instance)
        })

        Object.defineProperty(window, "find", {
            configurable: true,
            writable: false,
            value: (sprite: string) => this.instances.find(x => x.spriteID == sprite),
        })

        Object.defineProperty(window, "findAll", {
            configurable: true,
            writable: false,
            value: (sprite: string) => this.instances.filter(x => x.spriteID == sprite),
        })

        Object.defineProperty(window, "setDepth", {
            configurable: true,
            writable: false,
            value: (self: SpriteInstance, depth: number) => {
                if(self.pixiSprite) self.pixiSprite.zIndex = depth;
            }
        })

        Object.defineProperty(window, "goToNextRoom", {
            configurable: true,
            writable: false,
            value: (self: SpriteInstance, depth: number) => {
                this.roomNumber++;
            }
        })

        Object.defineProperty(window, "keyIsDown", {
            configurable: true,
            writable: false,
            value: (...codes: string[]) => this.checkKeys("down", ...codes)
        })
        Object.defineProperty(window, "keyIsPressed", {
            configurable: true,
            writable: false,
            value: (...codes: string[]) => this.checkKeys("pressed", ...codes)
        })
        Object.defineProperty(window, "keyIsReleased", {
            configurable: true,
            writable: false,
            value: (...codes: string[]) => this.checkKeys("released", ...codes)
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

        let rooms = this.resourceManager.getAllOfResourceType(Room);
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
        const sprite = this.resourceManager.findByUUID(spriteUUID) as Sprite;
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

    setRoom(roomUUID: string) {
        this.currentRoomUUID = roomUUID;
        const room = this.currentRoom();
        this.renderer.resize(room.width, room.height)
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
        //     let sprite = this.resourceManager.findByUUID(i.spriteID) as Sprite;
        //     return sprite._instanceConstructor(i.x, i.y);
        // })

        this.instances = [];

        for(let roomInst of room.instances) {
            this.createInstance(roomInst.spriteID, roomInst.x, roomInst.y)
        }
    }

    _registerInstance(inst: SpriteInstance) {
        let sprite = this.resourceManager.findByUUID(inst.spriteID) as Sprite;
        // if(!sprite || !sprite.canvas) return;

        let pixiSpr = pixi.Sprite.from(sprite.canvas);
        pixiSpr.x = inst.x;
        pixiSpr.y = inst.y;
        pixiSpr.pivot.set(sprite.originX, sprite.originY);
        this.stage.addChild(pixiSpr);
        inst.pixiSprite = pixiSpr;
    }

    currentRoom() : Room {
        if(!this._cachedRoom || this._cachedRoom.uuid != this.currentRoomUUID) {
            this._cachedRoom = this.resourceManager.findByUUID(this.currentRoomUUID) as Room;
        }
        return this._cachedRoom;
    }

    quit() {
        // clean up
        this.isEnding = true;
    }

    update() {
        if(this.roomNumber != this.actualRoomNumber) {
            let allRooms = this.resourceManager.getAllOfResourceType(Room);
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
            inst.update();
            inst.pixiSprite.x = inst.x;
            inst.pixiSprite.y = inst.y;
        }

        // this.draw();
        this.stage.sortChildren();
        this.renderer.render(this.stage);
        
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