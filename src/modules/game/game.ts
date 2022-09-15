import { deepClone } from "../database";
import type Instance from "../structs/instance";
import Room from "../structs/room";
import type ResourceManager from "./ResourceManager";

export default class Game {
    tickRate: number;
    currentRoomUUID: string;
    resourceManager: ResourceManager;
    _cachedRoom: Room|null;
    canvas: HTMLCanvasElement;
    tickNumber: number;
    isEnding: boolean;

    instances: Instance[];

    constructor(resourceManager: ResourceManager, canvas: HTMLCanvasElement) {
        this.tickRate = 60;
        this.currentRoomUUID = ""; // actually set later using setRoom
        this.resourceManager = resourceManager;
        this.canvas = canvas;
        this._cachedRoom = null;
        this.tickNumber = 0;
        this.isEnding = false;
        this.instances = [];

        this.setRoom(resourceManager.getAllOfResourceType(Room)[0].uuid);
        
        // TODO weird and hacky
        window.setTimeout(() => this.update(), 10);
    }

    setRoom(roomUUID: string) {
        this.currentRoomUUID = roomUUID;
        const room = this.currentRoom();
        this.canvas.width = room.width;
        this.canvas.height = room.height;

        this.instances = room.instances.map(i => i.clone());
    }

    currentRoom() : Room {
        if(!this._cachedRoom || this._cachedRoom.uuid != this.currentRoomUUID) {
            this._cachedRoom = this.resourceManager.findByUUID(this.currentRoomUUID) as Room;
        }
        return this._cachedRoom;
    }

    quit() {
        this.isEnding = true; // TODO race conditions ? 
    }

    update() {

        for(let inst of this.instances) {
            inst.tick();
        }

        this.draw();
        
        if(!this.isEnding) window.requestAnimationFrame(() => this.update());
        this.tickNumber ++;
    }

    draw() {
        let room = this.currentRoom();
        if(!room) return;
        
        let ctx = this.canvas?.getContext("2d")!;
        if(!ctx) return;

        // ctx.clearRect(0, 0, room.width, room.height);
        ctx.fillStyle = room.backgroundColor;
        ctx.fillRect(0, 0, room.width, room.height);

        room.filterInstances(); // TODO kind of unnecessary work

        for(let inst of this.instances) {
            inst.draw(ctx);
        }

        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`${this.tickNumber}`, 5, 5);
    }
}