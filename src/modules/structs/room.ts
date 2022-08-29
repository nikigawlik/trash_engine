import RoomEditor from "../../components/RoomEditor.svelte";
import { bringToFront, cards, openCard } from "../cardManager";
import type ResourceManager from "../ResourceManager";
import { assert } from "../utils";
import type Instance from "./instance";
import Resource from "./resource";

export default class Room extends Resource {
    width: number;
    height: number;
    instances: Instance[];
    backgroundColor: string;
    gridEnabled: boolean;
    gridWidth: number;
    gridHeight: number;
    gridSnap: string;
    _canvas: HTMLCanvasElement | null;
    constructor(name = "room", resourceManager: ResourceManager) {
        super(name, resourceManager);
        this.width = ~~(540 * 12/9);
        this.height = 540;
        this.instances = [];
        this.backgroundColor = "#222";
        this.gridEnabled = true;
        this.gridWidth = 60;
        this.gridHeight = 60;
        this.gridSnap = "center"; // "center" or "corner"
        this._canvas = null;
    }

    openEditorWindow() {
        // look for existing

        // openCard(RoomEditor)

        let existing = cards.get().find(x => x.uuid == this.uuid);
        
        if(existing) {
            cards.focus(existing.uuid);
        } else {
            cards.add(RoomEditor, this.name, this.uuid);
            // this.refresh(); // TODO ?
            
            // // after load hack
            // setTimeout(() => {
            //     let style = getComputedStyle(elmt);
            //     elmt.style.width = style.width;
            //     // elmt.style.width = style.width || elmt.getBoundingClientRect().width + "px";
            //     elmt.querySelector(".sprite-select").style.flexDirection = "row";
            // }, 50);
        }  
    }
    
    getIconElement() {
        return `🌳`;
    }

    refresh() {
        /** @type {CanvasRenderingContext2D} */
        let ctx = this._canvas?.getContext("2d");

        if(!ctx) return;

        // ctx.clearRect(0, 0, this.width, this.height);
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, this.width, this.height);

        for(let inst of this.instances) {
            inst.draw(ctx);
        }

        // draw grid
        if(this.gridEnabled) {
            ctx.strokeStyle = "gray";
            ctx.globalCompositeOperation = "difference";
            ctx.beginPath();
            assert(this.gridWidth >= 1 && this.gridHeight >= 1)
            for(let x = 0; x < this.width; x += this.gridWidth) {
                ctx.moveTo(x + 0.5, 0);
                ctx.lineTo(x + 0.5, this.height);
            }
            for(let y = 0; y < this.height; y += this.gridHeight) {
                ctx.moveTo(0, y + 0.5);
                ctx.lineTo(this.width, y + 0.5);
            }
            ctx.stroke();
            ctx.closePath();
            ctx.globalCompositeOperation = "source-over";
        }
    }
}

