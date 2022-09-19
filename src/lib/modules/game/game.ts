import type Instance from "../structs/instance";
import Room from "../structs/room";
import type ResourceManager from "./ResourceManager";
import * as pixi from 'pixi.js';
import type Sprite from "../structs/sprite";

export default class Game {
    tickRate: number;
    currentRoomUUID: string;
    resourceManager: ResourceManager;
    _cachedRoom: Room|null;
    canvas: HTMLCanvasElement;
    tickNumber: number;

    instances: Instance[];
    pixiApp: pixi.Application;

    constructor(resourceManager: ResourceManager, canvas: HTMLCanvasElement) {
        this.tickRate = 60;
        this.currentRoomUUID = ""; // actually set later using setRoom
        this.resourceManager = resourceManager;
        this.canvas = canvas;
        this._cachedRoom = null;
        this.tickNumber = 0;
        this.instances = [];

        this.pixiApp = new pixi.Application({
            view: canvas,
            autoDensity: false,
            antialias: false,
        });

        this.setRoom(resourceManager.getAllOfResourceType(Room)[0].uuid);
        
        // TODO weird and hacky
        window.setTimeout(() => this.init(), 10);
    }

    async init() {
        // // load assets
        // for(let sprite of this.resourceManager.getAllOfResourceType(Sprite) as unknown as Sprite[]) {
        //     let sprCanvas = sprite.canvas;
        //     pixi.Loader.shared.add()
        // }

        // start
        // this.update();
    }

    setRoom(roomUUID: string) {
        this.currentRoomUUID = roomUUID;
        const room = this.currentRoom();
        this.pixiApp.renderer.resize(room.width, room.height)
        this.pixiApp.renderer.backgroundColor = pixi.utils.string2hex(room.backgroundColor);
        // console.log(`${room.backgroundColor} -> ${pixi.utils.string2hex(room.backgroundColor)}`)

        // TODO kinda hacky
        document.body.style.backgroundColor = room.backgroundColor;

        this.instances = room.instances.map(i => i.clone());
        for(let inst of this.instances) {
            let sprite = this.resourceManager.findByUUID(inst.spriteID) as Sprite;
            if(!sprite || !sprite.canvas) continue;

            let pixiSpr = pixi.Sprite.from(sprite.canvas);
            pixiSpr.x = inst.x - sprite.originX;
            pixiSpr.y = inst.y - sprite.originY;
            this.pixiApp.stage.addChild(pixiSpr);
        }
    }

    currentRoom() : Room {
        if(!this._cachedRoom || this._cachedRoom.uuid != this.currentRoomUUID) {
            this._cachedRoom = this.resourceManager.findByUUID(this.currentRoomUUID) as Room;
        }
        return this._cachedRoom;
    }

    quit() {
        // this.pixiApp.destroy()
    }

    // update() {

    //     for(let inst of this.instances) {
    //         inst.tick();
    //     }

    //     this.draw();
        
    //     if(!this.isEnding) window.requestAnimationFrame(() => this.update());
    //     this.tickNumber ++;
    // }

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