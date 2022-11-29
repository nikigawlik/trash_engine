<script lang="ts">
import { resourceManager } from "../modules/game/ResourceManager";

import Instance from "./../modules/structs/instance";

import type Room from "./../modules/structs/room";
import type Sprite from "./../modules/structs/sprite";
import { assert, rectInside, adjustedCanvasSize } from "../modules/game/utils";

import { afterUpdate, onMount } from "svelte";
import type { CardInstance } from "../modules/cardManager";
import { data } from "../modules/globalData";
import Card from "./Card.svelte";
import SpriteIcon from "./SpriteIcon.svelte";
import type { Writable } from "svelte/store";
import { shrink } from "../transitions";
    
    export let card: CardInstance;
    const uuid = card.uuid;
    
    $: room = $resourceManager?.getResource(uuid) as Room|null;
    $: card.className = "room-editor";
    $: card.name = room?.name || "room not loaded";


    let sprites = [] as Sprite[];
    $: sprites = ($resourceManager.getSprites() || []);

    let canvas: HTMLCanvasElement;
    let currentSprite: Sprite = sprites[0];
    
    let roomStore = $resourceManager.getResourceStore(uuid) as Writable<Room>;

    // let gridEnabled = $roomStore.grid.enabled;
    // let gridWidth = $roomStore.grid.width;
    // let gridHeight = $roomStore.grid.height;
    // let snapMode = $roomStore.grid.snap;
    // $: {
        // $roomStore.grid.enabled = gridEnabled;
        // $roomStore.grid.width = gridWidth;
        // $roomStore.grid.height = gridHeight;
        // $roomStore.grid.snap = snapMode;
    // }

    $: gridWidth = Math.max(room.grid.width, 1)
    $: gridHeight = Math.max(room.grid.height, 1)

    // let bgColor = room?.backgroundColor || "#222222";
    // $: room && (room.backgroundColor = bgColor);
    
    // default for when room is not loaded
    $: canvasWidth = room?.width || 100;
    $: canvasHeight = room?.height || 100;
    
    $: canvasDisplayHeight = adjustedCanvasSize(canvasHeight);
    $: canvasDisplayWidth = adjustedCanvasSize(canvasWidth); 

    afterUpdate(() => {
        refresh();
    });
    
    // placing
    function canvasPlacement(evt: MouseEvent, isDownEvent: boolean) {
        console.log("here")
        if(!room || evt.button != 0) return;

        const inputX = (evt.offsetX) * (canvas.width / canvasDisplayWidth);
        const inputY = (evt.offsetY) * (canvas.height / canvasDisplayHeight);

        // first remove stuff
        let mousepos = new DOMRect(inputX, inputY, 0, 0);
        let getBBRect = (inst: Instance) => {
            let sprite = $resourceManager.getResource(inst.spriteID) as Sprite;
            return sprite? new DOMRect(
                inst.x - sprite.originX + sprite.bBoxX, 
                inst.y - sprite.originY + sprite.bBoxY, 
                sprite.bBoxWidth, 
                sprite.bBoxHeight
            ) : null;
        }
        let alreadyExists = false;
        let filteredInstances = room.instances.filter(inst => {
            const rect = getBBRect(inst);
            if (!rect || !rectInside(mousepos, rect)) return true;
            if (!currentSprite) return false;

            const sameSprite = inst.spriteID == currentSprite.uuid; 
            if(isDownEvent && sameSprite) 
                isDeleting = true;
            
            if(sameSprite) 
                alreadyExists = true;
            
            return (sameSprite && !isDeleting);
        });

        let deletedSomething = filteredInstances.length != room.instances.length;
        room.instances = filteredInstances;

        if(!deletedSomething && !isDeleting && currentSprite && !alreadyExists) {
            // place something
            let x: number, y: number;
            if(!$roomStore.grid.enabled) {
                x = Math.floor(inputX);
                y = Math.floor(inputY);
            } else
            if($roomStore.grid.snap == "center") {

                x = (Math.floor(inputX / gridWidth) + 0.5) * gridWidth;
                y = (Math.floor(inputY / gridHeight) + 0.5) * gridHeight;
            } else 
            if($roomStore.grid.snap == "corner") {
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

    let isPlacing = false;
    let isDeleting = false;

    function canvasMouseDown(evt: MouseEvent) {
        if(evt.button != 0) return;
        isPlacing = true;
        isDeleting = false;
        canvasPlacement(evt, true);
    }
    
    function canvasMouseMove(evt: MouseEvent) {
        if(isPlacing) canvasPlacement(evt, false);
    }
    function canvasMouseUp(evt: MouseEvent) {
        isPlacing = false;
        isDeleting = false;
    }
    
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
        if($roomStore.grid.enabled) {
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

    let spriteOpen = true;
    let configOpen = true;
</script>
<!-- isMaximized is intentionally non-reactive, still a bit sussy, might not work as expected -->
<Card {card} isMaximized={data.get().editor.settings.openResourcesMaximized}>
    <div class="horizontal">
        <div class="left-rider">
            <h4><button 
                on:click={() => spriteOpen = !spriteOpen} 
                class:rotated={!spriteOpen}
            >sprites</button></h4>
            {#if spriteOpen}
            <div class="sprite-select scroll-box" transition:shrink|local={{delay: 0, duration: 100}}>
                {#each sprites as spr (spr.uuid)}
                    <button 
                    data-uuid={spr.uuid} 
                    data-selected={currentSprite == spr}
                    on:click={() => currentSprite = spr}
                    >
                        <h4>{spr.name}</h4> 
                        <div class="icon">
                            <SpriteIcon spriteID={spr.uuid} growToFit={true}></SpriteIcon>
                        </div>
                    </button>
                {/each}
            </div>
            {/if}
        </div>
        <div class="room-rider">
            <h4><button 
                on:click={() => configOpen = !configOpen} 
                class:rotated={!configOpen}
            >config</button></h4>
            {#if configOpen}
            <div class="room-config"  transition:shrink|local={{delay: 0, duration: 100}}>
                <!-- <label for="view_mode">view</label>
                <label><input disabled type="radio" name="view_mode" value="2d" checked />  2D </label>
                <label><input disabled type="radio" name="view_mode" value="3d" /> 3D </label>
                <span class="spacer" /> -->
                <label><input type="checkbox" name="grid_enabled" bind:checked={$roomStore.grid.enabled}/> grid </label>
                <label for="grid_width" hidden> width </label> 
                <input name="grid_width" type="number" bind:value={$roomStore.grid.width} />
                x
                <label for="grid_height" hidden> height </label> 
                <input name="grid_height" type="number" bind:value={$roomStore.grid.height} />
                <span class="spacer" />
                <label for="snap_mode">snap</label>
                <label><input type="radio" value="center" checked bind:group={$roomStore.grid.snap} />  center </label>
                <label><input type="radio" value="corner" bind:group={$roomStore.grid.snap} /> corner </label>
                <!-- <span class="spacer" />
                <label for="background_color">background: </label><input name="background_color" type="color" bind:value={bgColor}/> -->
                <span class="spacer" />
                <label>bg color <input type="color" bind:value={$roomStore.backgroundColor} /></label>
                <label>width <input type="number" bind:value={$roomStore.width} /></label>
                <label>height <input type="number" bind:value={$roomStore.height} /></label>
            </div>
            {/if}
        </div>
        <div class="room-edit">
            <div class="canvas-container">
                <canvas 
                    width={canvasWidth} 
                    height={canvasHeight} 
                    style:width={canvasDisplayWidth}px
                    style:height={canvasDisplayHeight}px
                    class="room-canvas" 
                    bind:this={canvas}
                    on:mousedown={canvasMouseDown}
                    on:mousemove={canvasMouseMove}
                    on:mouseup={canvasMouseUp}
                    on:mouseleave={canvasMouseUp}
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

    h4 button {
        transition: transform .3s cubic-bezier(0.075, 0.82, 0.165, 1);
        transform-origin: bottom left;
    }
    .rotated {
        transform: rotate(90deg) translate(-1rem, 0) ;
        position: absolute;
        /* width: 1rem; */
    }
    h4 {
        min-width: 1rem;
    }

    .room-config {
        overflow-x: hidden;
    }

    .left-rider {
        /* flex: 1 1 120px;
        max-width: 7em;
        flex-shrink: 1; */

        display: flex;
        flex-direction: column;
        flex-wrap: nowrap;
    }

    .scroll-box {
        flex: 1 1 50vh;
        overflow: hidden;
        overflow-y: scroll;
        border: 1px solid transparent;
    }

    .sprite-select {
        padding: 4px;
        width: 6rem;
        /* max-height: 50vh; */

        display: flex;
        /* flex-grow: 0; */
        /* flex-direction: row; */
        flex-direction: column;
        /* flex-wrap: wrap; */
        gap: 0.1rem;
        
    }

    button {
        border: none;
        box-shadow: none;
    }

    .sprite-select h4 {
        /* text-align: left; */
        margin-bottom: .1rem;
    }

    .sprite-select .icon {
        height: 2rem;
    }

    button[data-selected="true"] {
        background-color: var(--off-bg-color);
        transform: translate(.4rem, 0);
        box-shadow: none;
    }
/* 
    button:active {
        transform: none;
    } */

    .room-edit {
        flex: 1 1 120px;
        flex-shrink: 1;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        min-width: 0;
    }

    .room-config {
        margin-bottom: 7px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        align-items: baseline;
        
    }

    .canvas-container {
        overflow: scroll;
        flex-shrink: 1;
    }

    .canvas-container canvas {
        /* display: block; */
        border: 1px dashed var(--main-color);
    }

    .room-config input[type=number] {
        width: 3.5em;
    }

    label {
        vertical-align: middle;
        /* margin: auto 0; */
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

/* input[type=color] {
    border: none;
    padding: 0;
    height: 2em;
    width: 2em;
} */

</style>