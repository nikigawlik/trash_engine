<script lang="ts">
import { resourceManager } from "../modules/game/ResourceManager";

import Instance from "./../modules/structs/instance";

import type Room from "./../modules/structs/room";
import Sprite from "./../modules/structs/sprite";
import { assert,rectInside } from "../modules/game/utils";

import { afterUpdate, onMount } from "svelte";
import type { CardInstance } from "../modules/cardManager";
import { data } from "../modules/globalData";
import Card from "./Card.svelte";
import SpriteIcon from "./SpriteIcon.svelte";
    
    export let card: CardInstance;
    const uuid = card.uuid;
    
    $: room = $resourceManager?.findByUUID(uuid) as Room|null;
    $: card.className = "room-editor";
    $: card.name = room?.name || "room not loaded";


    let sprites = [] as Sprite[];
    $: sprites = ($resourceManager.getAllOfResourceType(Sprite) || []) as unknown as Sprite[];

    let canvas: HTMLCanvasElement;
    let currentSprite: Sprite = sprites[0];

    let gridEnabled = false;
    let gridWidth = 60;
    let gridHeight = 60;

    
    // $: {$resourceManager; gridEnabled; gridWidth; gridHeight; }

    $: gridWidth = Math.max(gridWidth, 1)
    $: gridHeight = Math.max(gridHeight, 1)
    
    let snapMode = "center";

    // let bgColor = room?.backgroundColor || "#222222";
    // $: room && (room.backgroundColor = bgColor);
    
    // default for when room is not loaded
    $: canvasWidth = room?.width || 100;
    $: canvasHeight = room?.height || 100;
    
    // TODO could use a general solution for sizing canvases (room code is similar to the one in the sprite editor)
    const scaleFactor = 1;
    $: canvasDisplayHeight = canvasHeight / window.devicePixelRatio * scaleFactor;
    $: canvasDisplayWidth = canvasWidth / window.devicePixelRatio * scaleFactor; 

    afterUpdate(() => {
        refresh();
    });

    
    // placing
    let canvasMouseDown = (evt: MouseEvent) => {
            console.log("here")
            if(!room || evt.button != 0) return;

            const inputX = (evt.offsetX) * (canvas.width / canvasDisplayWidth);
            const inputY = (evt.offsetY) * (canvas.height / canvasDisplayHeight);

            // first remove stuff
            let mousepos = new DOMRect(inputX, inputY, 0, 0);
            // TODO inefficient, but room should be replaced by a proper bounding box collision system anyways
            let getBBRect = (inst: Instance) => {
                let sprite = $resourceManager.findByUUID(inst.spriteID) as Sprite;
                return sprite? new DOMRect(
                    inst.x - sprite.originX, 
                    inst.y - sprite.originY, 
                    sprite.canvas?.width || 0, 
                    sprite.canvas?.height || 0
                ) : null;
            }
            let filteredInstances = room.instances.filter(inst => {
                let rect = getBBRect(inst);
                return rect && !rectInside(mousepos, rect);
            });
            let deletedSomething = filteredInstances.length != room.instances.length;
            room.instances = filteredInstances;

            if(!deletedSomething && currentSprite) {
                // place something
                let x,y;
                if(!gridEnabled) {
                    x = Math.floor(inputX);
                    y = Math.floor(inputY);
                } else
                if(snapMode == "center") {

                    x = (Math.floor(inputX / gridWidth) + 0.5) * gridWidth;
                    y = (Math.floor(inputY / gridHeight) + 0.5) * gridHeight;
                } else 
                if(snapMode == "corner") {
                    x = (Math.round(inputX / gridWidth)) * gridWidth;
                    y = (Math.round(inputY / gridHeight)) * gridHeight;
                } else {
                    x = y = 0;
                }
                let instance = new Instance(currentSprite.uuid, x, y);
                room.instances.push(instance);
            }

            refresh();
        };

    
    function refresh() {
        /** @type {CanvasRenderingContext2D} */
        if(!room) return;
        let ctx = canvas?.getContext("2d")!;
        if(!ctx) return;

        // ctx.clearRect(0, 0, room.width, room.height);
        ctx.fillStyle = room.backgroundColor;
        ctx.fillRect(0, 0, room.width, room.height);

        room.filterInstances(); // TODO kind of unnecessary work

        for(let inst of room.instances) {
            inst.draw(ctx);
        }

        // draw grid
        if(gridEnabled) {
            ctx.strokeStyle = "gray";
            ctx.globalCompositeOperation = "difference";
            ctx.beginPath();
            assert(gridWidth >= 1 && gridHeight >= 1)
            for(let x = 0; x < room.width; x += gridWidth) {
                ctx.moveTo(x + 0.5, 0);
                ctx.lineTo(x + 0.5, room.height);
            }
            for(let y = 0; y < room.height; y += gridHeight) {
                ctx.moveTo(0, y + 0.5);
                ctx.lineTo(room.width, y + 0.5);
            }
            ctx.stroke();
            ctx.closePath();
            ctx.globalCompositeOperation = "source-over";
        }
    }
</script>
<!-- isMaximized is intentionally non-reactive, still a bit sussy, might not work as expected -->
<Card {card} isMaximized={data.get().editor.settings.openResourcesMaximized}>
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
                        <div class="icon">
                            <SpriteIcon sprite={spr} growToFit={false}></SpriteIcon>
                        </div>
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
                <label><input type="radio" value="center" checked bind:group={snapMode} />  center </label>
                <label><input type="radio" value="corner" bind:group={snapMode} /> corner </label>
                <!-- <span class="spacer" />
                <label for="background_color">background: </label><input name="background_color" type="color" bind:value={bgColor}/> -->
            </div>
            <div class="canvas-container">
                <canvas 
                    width={canvasWidth} 
                    height={canvasHeight} 
                    style:width={canvasDisplayWidth}px
                    style:height={canvasDisplayHeight}px
                    class="room-canvas" 
                    bind:this={canvas}
                    on:mousedown={canvasMouseDown}
                />
            </div>
        </div>
    </div>
</Card>

<style>
    /* .icon {
        height: 6em;
        width: 6em;
    } */

    .left-rider {
        flex: 1 1 120px;
        max-width: 7em;

        display: flex;
        flex-direction: column;
    }

    .scroll-box {
        flex: 1 1 50vh;
        overflow: hidden;
        overflow-y: scroll;
        border: 1px solid transparent;
    }

    .sprite-select {
        padding: 4px;
        /* max-height: 50vh; */

        display: flex;
        /* flex-grow: 0; */
        /* flex-direction: row; */
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
        
    }

    .sprite-select button {
        border: none;
        box-shadow: none;
    }

    .room-edit {
        flex: 1 1 120px;
        flex-shrink: 1;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        min-width: 0;
    }

    .room-top-bar {
        margin-bottom: 7px;
        display: flex;
        flex-direction: row;
        gap: 4px;
        align-items: stretch;
        
    }

    .canvas-container {
        overflow: scroll;
        flex-shrink: 1;
    }

    .canvas-container canvas {
        /* display: block; */
        border: 1px dashed var(--main-color);
    }

    .room-top-bar span.spacer {
        width: 8px;
    }

    .room-top-bar input[type=number] {
        width: 3.5em;
    }

    button[data-selected="true"] {
        background-color: var(--off-bg-color);
    }

    /* input[type=color] {
        border: none;
        padding: 0;
        height: 2em;
        width: 2em;
    } */

    label {
        vertical-align: middle;
        margin: auto 0;
    }

    label>* {
        vertical-align: middle;
    }
    
    .horizontal {
        min-height: 0;
        flex: 1 1 auto;

        display: flex;
        flex-direction: row;
        justify-content: space-between;
        gap: 8px;
    }

</style>