<script lang="ts">
import { resourceManager } from "../modules/game/ResourceManager";

import Instance from "./../modules/structs/instance";

import type Room from "./../modules/structs/room";
import Sprite from "./../modules/structs/sprite";
import { assert, rectInside, adjustedCanvasSize, rectIntersect } from "../modules/game/utils";

import { afterUpdate, onMount } from "svelte";
import { cards, type CardInstance } from "../modules/cardManager";
import { currentTheme, data } from "../modules/globalData";
import Card from "./Card.svelte";
import SpriteIcon from "./SpriteIcon.svelte";
import type { Writable } from "svelte/store";
import { shrink } from "../transitions";
    import TabView from "./TabView.svelte";
    import { text } from "svelte/internal";
    import AtlasIcon from "./AtlasIcon.svelte";
    
    export let card: CardInstance;
    const uuid = card.uuid;
    
    $: room = $resourceManager?.getResource(uuid) as Room|null;
    $: card.className = "room-editor";
    $: card.name = room?.name || "room not loaded";

    let canvas: HTMLCanvasElement;

    let sprites = [] as Sprite[];
    $: sprites = ($resourceManager.getSprites() || []);

    let currentSpriteUUID: string|null = null;
    $: {
        // find a card that is a sprite
        let spriteCard = $cards.find(card => $resourceManager.getResourceOfType(card.uuid, Sprite));
        if(spriteCard) {
            currentSpriteUUID = spriteCard.uuid;
        } else {
            // if none exists, use the first sprite, if possible
            let sprites = $resourceManager.getSprites();
            if(sprites.length > 0) 
                currentSpriteUUID = sprites[0].uuid
        }
    }

    $: currentSprite = currentSpriteUUID && $resourceManager.getResourceOfType(currentSpriteUUID, Sprite) as Sprite|null;
    
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

    $: gridWidth = Math.max($roomStore.grid.width, 1)
    $: gridHeight = Math.max($roomStore.grid.height, 1)

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

    let instancesUnderCursor = new WeakSet<Instance>();
    
    // placing / deleting etc.
    function canvasUpdate(evt: MouseEvent, isDownEvent: boolean) {
        if(!room) return;

        const inputX = (evt.offsetX) * (canvas.width / canvasDisplayWidth);
        const inputY = (evt.offsetY) * (canvas.height / canvasDisplayHeight);

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
        // update the weakset of the instances under the cursor (candidates for deletion)
        instancesUnderCursor = new WeakSet();
        for(let inst of room.instances) {
            const rect = getBBRect(inst);
            if(rect && rectInside(mousepos, rect))
                instancesUnderCursor.add(inst);
        }
        
        let filteredInstances = room.instances.filter(inst => !instancesUnderCursor.has(inst));

        // let deleteSomething = isDeleting && filteredInstances.length != room.instances.length;
        let canDeleteSomething = tool == "delete" && isMouseDown && filteredInstances.length != room.instances.length;
        if(canDeleteSomething) 
            room.instances = filteredInstances;

        // place something
        if(tool == "place" && placingInst) {
            let {x, y} = getPlacementPos(inputX, inputY)
            placingInst.x = x;
            placingInst.y = y;

            let alreadyExists = room.instances.find(inst => 
                inst.spriteID == currentSprite.uuid
                && rectIntersect(getBBRect(inst), getBBRect(placingInst))
            )
                            
            if(isMouseDown && currentSprite && !alreadyExists) {
                room.instances.push(placingInst);
                placingInst = new Instance(currentSpriteUUID, x, y);
            }
        } else {
            placingInst = null;
        }

        refresh();
    };

    $: placingInst = tool == "place" ? new Instance(currentSpriteUUID, -10000, 0) : null;

    function getPlacementPos(inputX: number, inputY: number) {
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
            x = Math.min(Math.max(x, 0), canvasWidth) // for safety
            y = Math.min(Math.max(y, 0), canvasHeight)
            return {x, y};
        }

    // let isPlacing = false;
    // let isDeleting = false;

    let isMouseDown = false;

    let tool: "place" | "delete" = "place"

    function canvasMouseDown(evt: MouseEvent) {
        if(evt.button != 0) return;
        // isPlacing = true;
        // isDeleting = false;
        isMouseDown = true;
        canvasUpdate(evt, true);
    }
    
    function canvasMouseMove(evt: MouseEvent) {
        canvasUpdate(evt, false);
    }
    function canvasMouseUp(evt: MouseEvent) {
        // isPlacing = false;
        // isDeleting = false;
        isMouseDown = false;
    }
    
    function refresh() {
        /** @type {CanvasRenderingContext2D} */
        if(!room) return;
        let ctx = canvas?.getContext("2d")!;
        if(!ctx) return;

        // ctx.clearRect(0, 0, room.width, room.height);
        ctx.fillStyle = room.backgroundColor;
        ctx.fillRect(0, 0, room.width, room.height);

        room.filterInstances();

        for(let inst of room.instances) {
            inst.draw(ctx);
            if(tool == "delete" && instancesUnderCursor.has(inst)) {
                ctx.strokeStyle = "white";
                ctx.globalCompositeOperation = "difference";
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(inst.x - 25 + Math.random() * 10, inst.y - 25 + Math.random() * 10);
                ctx.lineTo(inst.x + 25 + Math.random() * 10, inst.y + 25 + Math.random() * 10);
                ctx.moveTo(inst.x - 25 + Math.random() * 10, inst.y + 25 + Math.random() * 10);
                ctx.lineTo(inst.x + 25 + Math.random() * 10, inst.y - 25 + Math.random() * 10);
                ctx.stroke();
                ctx.closePath();
                ctx.globalCompositeOperation = "source-over";
            }
        }
        if(placingInst) placingInst.draw(ctx);

        // draw grid
        if($roomStore.grid.enabled) {
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 1;
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

    let mode = "place sprites";

    const tools = ["place", "delete"] as ("place"|"delete")[];

</script>
<!-- isMaximized is intentionally non-reactive, still a bit sussy, might not work as expected -->
<Card 
    contentMinWidth={~~($roomStore.width / devicePixelRatio + 16)}
    namePrefix="edit room: " 
    isMaximized={data.get().editor.settings.openResourcesMaximized}
    {card} 
>
    <TabView tabs={["place sprites", "settings"]} bind:selected={mode}/>
        {#if mode=="place sprites"}
            <h4 style:height="0">tools:</h4>
            <div class="toolbar" style:height="2.5rem">
                <!-- <span>tools: </span> -->
                {#each tools as t}
                    <button 
                        class:selected={tool == t}
                        class:emphasis={tool == t}
                        on:click={() => tool = t}
                        style:vertical-align="middle"
                    >
                    {t}
                    {#if t == "place"}
                        <div style:height="1.5rem" style:display="inline-block">
                            <SpriteIcon spriteID={currentSpriteUUID} growToFit />
                        </div>
                    {/if}
                    </button>
                {/each}
            </div>
            {#if !currentSprite}
                <span> please select a sprite from the resource list.</span>
            {/if}
            
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
            <h4>
                {#if tool == "place"}
                <AtlasIcon id={41} height={12}/> select the current sprite from resource list. drag to place multiple.
                {:else if tool == "delete"}
                <AtlasIcon id={41} height={12}/> click sprites to delete them.
                {/if}
            </h4>
        {:else if mode=="settings"}
            <div class="room-config">
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
</Card>

<style>
    .room-config {
        overflow-x: hidden;
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

    .toolbar {
        /* margin-top: 6px; */
        margin-bottom: 6px;
        /* width: 100%; */
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        /* justify-content: space-between; */
        justify-content: center;
        gap: 4px;
    }

    .toolbar button {
        padding: 3px;
        display: block;
        /* padding: 0; */
        /* padding-bottom: 2px; */
    }

</style>