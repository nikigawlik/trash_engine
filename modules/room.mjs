import { appendCard, Card, cards, createContextMenu } from "./components.mjs";
import { html } from "./deps.mjs";
import { data } from "./globalData.mjs";
import { Resource } from "./resource.mjs";
import { Sprite } from "./sprite.mjs";
import { bringToFront } from "./ui.mjs";
import { Instance } from "./instance.mjs"

export class Room extends Resource {
    constructor(name = "room", resourceManager = null) {
        super(name, resourceManager);
        this.width = 540 * (5/4);
        this.height = 540;
        this.instances = [];
        this.canvas = null;
    }

    openEditorWindow() {
        // look for existing
        let existing = cards.find(x => x.dataset.resourceUuid == this.uuid);
        
        if(existing) {
            bringToFront(existing);
        } else {
            let elmt = html`
            <${RoomWindow} room=${this} />
            `;
            appendCard(elmt);
            if(data.editor.settings.openResourcesMaximized) {
                // TODO hacky
                elmt.querySelector("button.maxWindow").click();
            }
            this.refresh();
            
            // after load hack
            setTimeout(() => {
                let style = getComputedStyle(elmt);
                elmt.style.width = style.width;
                // elmt.style.width = style.width || elmt.getBoundingClientRect().width + "px";
                elmt.querySelector(".sprite-select").style.flexDirection = "row";
            }, 50);
        }  
    }
    
    getIconElement() {
        return html`<span>🌳</span>`;
    }

    refresh() {
        let ctx = this.canvas.getContext("2d");
        for(let inst of this.instances) {
            inst.draw(ctx);
        }
    }
}


let RoomWindow = (attrs={ room: null }, ...children) => {
    let self = attrs.room;
    let icon = spr => {
        let canvas = spr.getCopy();
        // canvas.style.width = 
        canvas.style.height = 50 + "px";
        return canvas;
    }
    let sprites = () => 
        attrs.room._resourceManager.getAllOfResourceType(Sprite)
        .map(spr => html`
            ${html`
            <button data-uuid=${spr.uuid}>
                <h4>${spr.name}</h4> 
                ${icon(spr)} 
            </button>
            `}
        `);
    
    let elmt = html`
        <${Card} name=${self.name} resourceUUID=${self.uuid} class=room-editor>
        <div class="horizontal">    
            <div class="left-rider">
                <h4>sprites</h4>
                <div class="sprite-select scroll-box">
                    ${sprites()}
                </div>
            </div>
            <div class="canvas-container">
                <canvas width=${self.width} height=${self.height} class="room-canvas"/>
            </div>
        </div>
        <//>
    `;

    attrs.room.canvas = elmt.querySelector("canvas.room-canvas");

    let currentSprite = null;
    let sprButtons = elmt.querySelectorAll(".sprite-select button");
    for(let b of sprButtons) {
        b.onclick = () => {
            for(let otherB of sprButtons) {
                otherB.dataset.selected = false;
            }
            b.dataset.selected = true;
            currentSprite = attrs.room._resourceManager.findByUUID(b.dataset.uuid);
        }
    }
    if(sprButtons[0]) sprButtons[0].onclick(); // select first

    // placing
    /** @type {HTMLCanvasElement} */
    let canvas = elmt.querySelector("canvas.room-canvas");
    canvas.onclick = evt => {
        let instance = new Instance(currentSprite.uuid, evt.offsetX, evt.offsetY);
        attrs.room.instances.push(instance);
        attrs.room.refresh();
    };

    return elmt;
}