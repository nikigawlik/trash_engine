import { appendCard, Card, cards } from "./components.mjs";
import { html } from "./deps.mjs";
import { data } from "./globalData.mjs";
import { Instance } from "./instance.mjs";
import { Resource } from "./resource.mjs";
import { ResourceManager } from "./resource_manager.mjs";
import { Sprite } from "./sprite.mjs";
import { bringToFront } from "./ui.mjs";
import { assert, parseIntSafe, rectInside } from "./utils.mjs";

export class Room extends Resource {
    constructor(name = "room", resourceManager = null) {
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
        /** @type {CanvasRenderingContext2D} */
        let ctx = this._canvas.getContext("2d");

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


let RoomWindow = (attrs={ room: null }, ...children) => {
    /** @type {Room} */
    let self = attrs.room;
    let icon = spr => {
        let canvas = spr.getCopy();
        // canvas.style.width = 
        canvas.style.height = 50 + "px";
        return canvas;
    }
    let sprites = () => 
        self._resourceManager.getAllOfResourceType(Sprite)
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
            <div class="room-edit">
                <div class="room-top-bar">
                    <!-- <label for="view_mode">view</label>
                    <label><input disabled type="radio" name="view_mode" value="2d" checked />  2D </label>
                    <label><input disabled type="radio" name="view_mode" value="3d" /> 3D </label>
                    <span class="spacer" /> -->
                    <label><input type="checkbox" name="grid_enabled"  checked=${self.gridEnabled}/> grid </label>
                    <label for="grid_width" hidden> width </label> 
                    <input name="grid_width" type="number" value=${self.gridWidth} />
                    x
                    <label for="grid_height" hidden> height </label> 
                    <input name="grid_height" type="number" value=${self.gridHeight} />
                    <span class="spacer" />
                    <label for="snap_mode">snap</label>
                    <label><input type="radio" name="snap_mode" value="center" checked />  center </label>
                    <label><input type="radio" name="snap_mode" value="corner" /> corner </label>
                </div>
                <div class="canvas-container">
                    <canvas width=${self.width} height=${self.height} class="room-canvas"/>
                </div>
            </div>
        </div>
        <//>
    `;

    self._canvas = elmt.querySelector("canvas.room-canvas");


    // TODO could use a general solution for sizing canvases (this code is similar to the one in the sprite editor)
    let canvasDisplayWidth, canvasDisplayHeight;
    let resizeCanvas = (scaleFactor) => {
        canvasDisplayWidth =  self._canvas.width / window.devicePixelRatio * scaleFactor;
        canvasDisplayHeight =  self._canvas.height / window.devicePixelRatio * scaleFactor;
        self._canvas.style.width = canvasDisplayWidth + "px";
        self._canvas.style.height = canvasDisplayHeight + "px";
    }
    let adjustedX = x => x * (self._canvas.width / canvasDisplayWidth);
    let adjustedY = y => y * (self._canvas.height / canvasDisplayHeight);

    resizeCanvas(1); // default scale

    let currentSprite = null;
    let sprButtons = elmt.querySelectorAll(".sprite-select button");
    for(let b of sprButtons) {
        b.onclick = () => {
            for(let otherB of sprButtons) {
                otherB.dataset.selected = false;
            }
            b.dataset.selected = true;
            currentSprite = self._resourceManager.findByUUID(b.dataset.uuid);
        }
    }
    if(sprButtons[0]) sprButtons[0].onclick(); // select first

    // room settings
    // - grid
    let gridCheckbox = elmt.querySelector("input[name=grid_enabled]");
    gridCheckbox.checked = self.gridEnabled;
    gridCheckbox.onclick = () => {
        self.gridEnabled = gridCheckbox.checked;
        self.refresh();
    }
    let gridWidthInput = elmt.querySelector("input[name=grid_width]")
    let gridHeightInput = elmt.querySelector("input[name=grid_height]")
    gridWidthInput.onchange = () => (gridWidthInput.value = self.gridWidth = parseIntSafe(gridWidthInput.value, 1)) && self.refresh();
    gridHeightInput.onchange = () => (gridHeightInput.value = self.gridHeight = parseIntSafe(gridHeightInput.value, 1)) && self.refresh();
    // - snap mode
    let snapModeRadioInputs = elmt.querySelectorAll("input[name=snap_mode]");
    // self.gridSnap = Array.from(snapModeRadioInputs).filter(e => e.checked)[0].value;

    for(let input of snapModeRadioInputs) {
        input.checked = input.value == self.gridSnap;

        // kinda hacky (is this way because of firefox label bug)
        // bug -> https://stackoverflow.com/questions/58840134/html-label-doesnt-trigger-the-respective-input-if-the-mouse-gets-moved-while-cl
        // TODO could implement a proper click, where we also check if mousedown was pressed before
        input.onchange = () => self.gridSnap = Array.from(snapModeRadioInputs).filter(e => e.checked)[0].value
        input.onmouseup = 
        input.parentElement.onmouseup = () => {
            input.checked = true;
            input.onchange();
        }
    }

    // placing
    /** @type {HTMLCanvasElement} */
    let canvas = elmt.querySelector("canvas.room-canvas");
    // canvas.oncontextmenu = evt => false;
    canvas.onmousedown = evt => {
        if(evt.button != 0) return;
        const inputX = adjustedX(evt.offsetX);
        const inputY = adjustedY(evt.offsetY);
        // first remove stuff
        let mousepos = new DOMRect(inputX, inputY, 0, 0);
        // TODO inefficient, but this should be replaced by a proper bounding box collision system anyways
        let getBBRect = inst => {
            let sprite = ResourceManager.resourceManager.findByUUID(inst.spriteID);
            return sprite? new DOMRect(
                inst.x - sprite.originX, 
                inst.y - sprite.originY, 
                sprite.canvas.width, 
                sprite.canvas.height
            ) : null;
        }
        let filteredInstances = self.instances.filter(inst => {
            let rect = getBBRect(inst);
            return rect && !rectInside(mousepos, rect);
        });
        let deletedSomething = filteredInstances.length != self.instances.length;
        self.instances = filteredInstances;

        if(!deletedSomething) {
            // place something
            let x,y;
            if(!self.gridEnabled) {
                x = inputX;
                y = inputY;
            } else
            if(self.gridSnap == "center") {

                x = (Math.floor(inputX / self.gridWidth) + 0.5) * self.gridWidth;
                y = (Math.floor(inputY / self.gridHeight) + 0.5) * self.gridHeight;
            } else 
            if(self.gridSnap == "corner") {
                x = (Math.round(inputX / self.gridWidth)) * self.gridWidth;
                y = (Math.round(inputY / self.gridHeight)) * self.gridHeight;
            }
            let instance = new Instance(currentSprite.uuid, x, y);
            self.instances.push(instance);
        }
        self.refresh();
    };

    return elmt;
}