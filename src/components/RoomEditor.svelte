<script lang="ts">
import { ResourceManager } from "src/modules/ResourceManager";

import Instance from "src/modules/structs/instance";

import type Room from "src/modules/structs/room";
import Sprite from "src/modules/structs/sprite";
import { rectInside } from "src/modules/utils";

import { onMount } from "svelte";
    export let self: Room;

    let icon = (spr: Sprite) => {
        let canvas = spr.getCopy();
        // canvas.style.width = 
        canvas.style.height = 50 + "px";
        return canvas;
    }
    // TODO reactive
    let sprites = self._resourceManager.getAllOfResourceType(Sprite) as Sprite[];

    let canvas: HTMLCanvasElement;
    let currentSprite: Sprite = sprites[0];

    let gridEnabled = false;
    let gridWidth = 60;
    let gridHeight = 60;

    let snapMode = "corner";

    onMount(async () => {

        // TODO could use a general solution for sizing canvases (this code is similar to the one in the sprite editor)
        let canvasDisplayWidth: number; 
        let canvasDisplayHeight: number;
        let resizeCanvas = (scaleFactor: number) => {
            canvasDisplayWidth =  canvas.width / window.devicePixelRatio * scaleFactor;
            canvasDisplayHeight =  canvas.height / window.devicePixelRatio * scaleFactor;
            canvas.style.width = canvasDisplayWidth + "px";
            canvas.style.height = canvasDisplayHeight + "px";
        }
        let adjustedX = (x: number) => x * (canvas.width / canvasDisplayWidth);
        let adjustedY = (y: number) => y * (canvas.height / canvasDisplayHeight);

        resizeCanvas(1); // default scale


        // room settings
        // - grid
        // TODO find a way to do this validation
        // gridWidthInput.onchange = () => (gridWidthInput.value = self.gridWidth = parseIntSafe(gridWidthInput.value, 1)) && self.refresh();
        // gridHeightInput.onchange = () => (gridHeightInput.value = self.gridHeight = parseIntSafe(gridHeightInput.value, 1)) && self.refresh();

        // - snap mode

        // placing

        // canvas.oncontextmenu = evt => false;
        canvas.onmousedown = evt => {
            if(evt.button != 0) return;
            const inputX = adjustedX(evt.offsetX);
            const inputY = adjustedY(evt.offsetY);
            // first remove stuff
            let mousepos = new DOMRect(inputX, inputY, 0, 0);
            // TODO inefficient, but this should be replaced by a proper bounding box collision system anyways
            let getBBRect = (inst: Instance) => {
                let sprite = ResourceManager.resourceManager.findByUUID(inst.spriteID) as Sprite;
                return sprite? new DOMRect(
                    inst.x - sprite.originX, 
                    inst.y - sprite.originY, 
                    sprite.canvas?.width || 0, 
                    sprite.canvas?.height || 0
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
                } else {
                    x = y = 0;
                }
                let instance = new Instance(currentSprite.uuid, x, y);
                self.instances.push(instance);
            }
            self.refresh();
        };

    })
    
</script>

<div class="horizontal">    
    <div class="left-rider">
        <h4>sprites</h4>
        <div class="sprite-select scroll-box">
            {#each sprites as spr}
                <button 
                data-uuid={spr.uuid} 
                data-selected={currentSprite == spr}
                on:click={() => currentSprite = spr}
                >
                    <h4>{spr.name}</h4> 
                    {icon(spr)} 
                </button>
            {/each}
        </div>
    </div>
    <div class="room-edit">
        <div class="room-top-bar">
            <!-- <label for="view_mode">view</label>
            <label><input disabled type="radio" name="view_mode" value="2d" checked />  2D </label>
            <label><input disabled type="radio" name="view_mode" value="3d" /> 3D </label>
            <span class="spacer" /> -->
            <label><input type="checkbox" name="grid_enabled" bind:checked={gridEnabled}/> grid </label>
            <label for="grid_width" hidden> width </label> 
            <input name="grid_width" type="number" bind:value={gridWidth} />
            x
            <label for="grid_height" hidden> height </label> 
            <input name="grid_height" type="number" bind:value={gridHeight} />
            <span class="spacer" />
            <label for="snap_mode">snap</label>
            <label><input type="radio" name="snap_mode" value="center" checked bind:group={snapMode} />  center </label>
            <label><input type="radio" name="snap_mode" value="corner" bind:group={snapMode} /> corner </label>
        </div>
        <div class="canvas-container">
            <canvas width={self.width} height={self.height} class="room-canvas" bind:this={canvas}/>
        </div>
    </div>
</div>
