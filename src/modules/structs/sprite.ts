import { cards } from "../cardManager";
import type ResourceManager from "../ResourceManager";
import Resource from "./resource";

console.log("sprite_editor.mjs loading")


export default class Sprite extends Resource {
    canvas: HTMLCanvasElement | null;
    originX: number;
    originY: number;
    constructor(name="sprite", resourceManager: ResourceManager) {
        super(name, resourceManager);
        this.canvas = null;
        this.originX = 0;
        this.originY = 0;
    }

    openEditorWindow() {
        // look for existing
        // TODO
        // let existing = cards.find(x => x.dataset.resourceUuid == this.uuid);
        
        // if(existing) {
        //     bringToFront(existing);
        // } else {
        //     let elmt = html`
        //     <${SpriteWindow} sprite=${this} />
        //     `;
        //     appendCard(elmt);
        //     if(data.editor.settings.openResourcesMaximized) {
        //         // TODO hacky
        //         elmt.querySelector("button.maxWindow").click();
        //     }
        // }  
    }

    getCopy() {
        let newCanvas = document.createElement("canvas");
        if(this.canvas) {
            newCanvas.width = this.canvas.width;
            newCanvas.height = this.canvas.height;
            let ctx = newCanvas.getContext("2d");
            ctx?.drawImage(this.canvas, 0, 0);
        }
        return newCanvas;
    }

    getIconElement() {
        let icon = this.getCopy();
        const emSize = 1.0;
        if(icon.width < icon.height) {
            icon.style.height = `${emSize}em`;
        } else {
            icon.style.width = `${emSize}em`;
        }
        return icon;
    }
}
