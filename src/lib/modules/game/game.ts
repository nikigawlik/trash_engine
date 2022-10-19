import Instance from "../structs/instance";
import Room from "../structs/room";
import type ResourceManager from "./ResourceManager";
import * as pixi from 'pixi.js';
import Sprite from "../structs/sprite";


export default class Game {
    tickRate: number;
    currentRoomUUID: string;
    resourceManager: ResourceManager;
    _cachedRoom: Room|null;
    canvas: HTMLCanvasElement;
    tickNumber: number;
    isEnding: boolean;

    instances: Instance[];
    renderer: pixi.Renderer;
    stage: pixi.Container;

    mouseX: number
    mouseY: number

    roomNumber: number
    actualRoomNumber: number

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

        this.renderer = new pixi.Renderer({
            view: canvas,
            autoDensity: false,
            antialias: false,
        });
        
        // TODO weird and hacky
        window.setTimeout(() => this.init(), 10);
    }

    async init() {
        // compile custom code
        for(let sprite of this.resourceManager.getAllOfResourceType(Sprite)) {
            // always true
            if(sprite instanceof Sprite) {
                sprite._initFunction = new Function(sprite.initCode);
                sprite._updateFunction = new Function(sprite.updateCode);
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
            value: (sprite: string, x: number, y: number): Instance => this.createInstance(sprite, x, y),
        })

        Object.defineProperty(window, "destroy", {
            configurable: true,
            writable: false,
            value: (instance: Instance) => this.destroyInstance(instance)
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

        Object.defineProperty(window, "callInit", {
            configurable: true,
            writable: false,
            value: (sprite: string, self: Instance) => {
                let spriteObj = (this.resourceManager.findByUUID(sprite) as Sprite);
                try {
                    spriteObj._initFunction.call(self);
                } catch(e) {
                    console.log(`Error in instance of sprite ${spriteObj.name}: `);
                    console.error(e);
                }
            }
        })

        Object.defineProperty(window, "callUpdate", {
            configurable: true,
            writable: false,
            value: (sprite: string, self: Instance) => {
                let spriteObj = (this.resourceManager.findByUUID(sprite) as Sprite);
                try {
                    spriteObj._updateFunction.call(self);
                } catch(e) {
                    console.log(`Error in instance of sprite ${spriteObj.name}: `);
                    console.error(e);
                }
            }
        })

        Object.defineProperty(window, "setDepth", {
            configurable: true,
            writable: false,
            value: (self: Instance, depth: number) => {
                if(self._pixiSprite) self._pixiSprite.zIndex = depth;
            }
        })

        Object.defineProperty(window, "goToNextRoom", {
            configurable: true,
            writable: false,
            value: (self: Instance, depth: number) => {
                this.roomNumber++;
            }
        })



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

    createInstance(spriteUUID: string, x: number, y: number) {
        const inst = new Instance(spriteUUID, x, y);
        this.instances.push(inst)
        this._registerInstance(inst);
        inst.create();
        return inst;
    }

    destroyInstance(instance: Instance) {
        let instID = this.instances.indexOf(instance);
        if(instID >= 0) this.instances.splice(instID, 1);
        if(instance._pixiSprite) this.stage.removeChild(instance._pixiSprite);
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

        this.instances = room.instances.map(i => i.clone());

        if(this.stage) this.stage.removeChildren()
        else this.stage = new pixi.Container();

        for(let inst of this.instances) {
            this._registerInstance(inst);
        }
        
        // call create events
        for(let inst of this.instances) {
            inst.create();
        }
    }

    _registerInstance(inst: Instance) {
        let sprite = this.resourceManager.findByUUID(inst.spriteID) as Sprite;
        if(!sprite || !sprite.canvas) return;

        let pixiSpr = pixi.Sprite.from(sprite.canvas);
        pixiSpr.x = inst.x;
        pixiSpr.y = inst.y;
        pixiSpr.pivot.set(sprite.originX, sprite.originY);
        this.stage.addChild(pixiSpr);
        inst._pixiSprite = pixiSpr;
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

        for(let inst of this.instances) {
            inst.tick();
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