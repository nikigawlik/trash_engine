<script lang="ts">
    
    import Instance from "./../modules/structs/instance";

    import {
        adjustedCanvasSize,
        assert,
        rectInside,
        rectIntersect,
    } from "../modules/game/utils";
    import Room from "./../modules/structs/room";
    import Sprite from "./../modules/structs/sprite";

    import { afterUpdate } from "svelte";
    import { cards, type CardInstance } from "../modules/cardManager";
    import { gameData } from "../modules/game/game_data";
    import { data } from "../modules/globalData";
    import { asStore } from "../modules/store_owner";
    import AtlasIcon from "./AtlasIcon.svelte";
    import Card from "./Card.svelte";
    import { getIFrameURL } from "./GamePreview.svelte";
    import SpriteIcon from "./SpriteIcon.svelte";
    import TabView from "./TabView.svelte";

    export let card: CardInstance;
    const uuid = card.uuid;

    $: room = $gameData.getResource(uuid, Room) as Room | null;
    $: card.className = "room-editor";
    $: card.name = room?.name || "room not loaded";

    let canvas: HTMLCanvasElement;

    let sprites = [] as Sprite[];
    $gameData.getResourceTypeStore(Sprite).subscribe(value => sprites = value)

    let currentSpriteUUID: string | null = null;
    $: {
        // find a card that is a sprite
        let spriteCard = $cards.find((card) =>
            $gameData.getResource(card.uuid, Sprite),
        );
        if (spriteCard) {
            currentSpriteUUID = spriteCard.uuid;
        } else {
            // if none exists, use the first sprite, if possible
            let sprites = $gameData.getAllOfResourceType(Sprite);
            if (sprites.length > 0) currentSpriteUUID = sprites[0].uuid;
        }
    }

    $: currentSprite =
        currentSpriteUUID &&
        ($gameData.getResource(
            currentSpriteUUID,
            Sprite,
        ) as Sprite | null);

    let roomStore = asStore($gameData.getResource(uuid, Room));

    $: gridWidth = Math.max($roomStore.grid.width, 1);
    $: gridHeight = Math.max($roomStore.grid.height, 1);

    // default for when room is not loaded
    $: canvasWidth = room?.width || 100;
    $: canvasHeight = room?.height || 100;

    $: canvasDisplayWidth = adjustedCanvasSize(canvasWidth);
    $: canvasDisplayHeight = adjustedCanvasSize(canvasHeight);

    afterUpdate(() => {
        refresh();
    });

    let instancesUnderCursor = new WeakSet<Instance>();

    // placing / deleting etc.
    function canvasUpdate(evt: MouseEvent, isDownEvent: boolean) {
        if (!room) return;

        const inputX = evt.offsetX * (canvas.width / canvasDisplayWidth);
        const inputY = evt.offsetY * (canvas.height / canvasDisplayHeight);

        let mousepos = new DOMRect(inputX, inputY, 0, 0);
        let getBBRect = (inst: Instance) => {
            let sprite = $gameData.getResource(inst.spriteID, Sprite);
            return sprite
                ? new DOMRect(
                      inst.x - sprite.originX + sprite.bBoxX,
                      inst.y - sprite.originY + sprite.bBoxY,
                      sprite.bBoxWidth,
                      sprite.bBoxHeight,
                  )
                : null;
        };
        // update the weakset of the instances under the cursor (candidates for deletion)
        instancesUnderCursor = new WeakSet();
        for (let inst of room.instances) {
            const rect = getBBRect(inst);
            if (rect && rectInside(mousepos, rect))
                instancesUnderCursor.add(inst);
        }

        let filteredInstances = room.instances.filter(
            (inst) => !instancesUnderCursor.has(inst),
        );

        // let deleteSomething = isDeleting && filteredInstances.length != room.instances.length;
        let canDeleteSomething =
            tool == "delete" &&
            isMouseDown &&
            filteredInstances.length != room.instances.length;
        if (canDeleteSomething) {
            room.instances = filteredInstances;
            $roomStore = $roomStore;
        }

        // place something
        if (tool == "place" && placingInst) {
            let { x, y } = getPlacementPos(inputX, inputY);
            placingInst.x = x;
            placingInst.y = y;

            let alreadyExists = room.instances.find(
                (inst) =>
                    inst.spriteID == currentSprite.uuid &&
                    rectIntersect(getBBRect(inst), getBBRect(placingInst)),
            );

            if (
                isMouseDown &&
                currentSprite &&
                (!alreadyExists || isDownEvent)
            ) {
                room.instances.push(placingInst);
                $roomStore = $roomStore;
                placingInst = new Instance(currentSpriteUUID, x, y);
            }
        } else {
            placingInst = null;
        }

        refresh();
    }

    $: placingInst =
        tool == "place" ? new Instance(currentSpriteUUID, -10000, 0) : null;

    function getPlacementPos(inputX: number, inputY: number) {
        let x: number, y: number;
        if (!$roomStore.grid.enabled) {
            x = Math.floor(inputX);
            y = Math.floor(inputY);
        } else if ($roomStore.grid.snap == "center") {
            x = (Math.floor(inputX / gridWidth) + 0.5) * gridWidth;
            y = (Math.floor(inputY / gridHeight) + 0.5) * gridHeight;
        } else if ($roomStore.grid.snap == "corner") {
            x = Math.round(inputX / gridWidth) * gridWidth;
            y = Math.round(inputY / gridHeight) * gridHeight;
        } else {
            x = y = 0;
        }
        x = Math.min(Math.max(x, 0), canvasWidth); // for safety
        y = Math.min(Math.max(y, 0), canvasHeight);
        return { x, y };
    }

    let isMouseDown = false;

    let tool: "place" | "delete" | "play" | "_" = "place";

    function canvasMouseDown(evt: MouseEvent) {
        if (evt.button != 0) return;
        isMouseDown = true;
        canvasUpdate(evt, true);
    }

    function canvasMouseMove(evt: MouseEvent) {
        canvasUpdate(evt, false);
    }
    function canvasMouseUp(evt: MouseEvent) {
        isMouseDown = false;
    }

    function refresh() {
        /** @type {CanvasRenderingContext2D} */
        if (!room) return;
        let ctx = canvas?.getContext("2d")!;
        if (!ctx) return;

        ctx.fillStyle = room.backgroundColor;
        ctx.fillRect(0, 0, room.width, room.height);

        room.instances = room.instances.filter(inst => instanceIsValid(inst));

        for (let inst of room.instances) {
            drawInstance(inst, ctx);
            if (tool == "delete" && instancesUnderCursor.has(inst)) {
                ctx.strokeStyle = "white";
                ctx.globalCompositeOperation = "difference";
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(
                    inst.x - 25 + Math.random() * 10,
                    inst.y - 25 + Math.random() * 10,
                );
                ctx.lineTo(
                    inst.x + 25 + Math.random() * 10,
                    inst.y + 25 + Math.random() * 10,
                );
                ctx.moveTo(
                    inst.x - 25 + Math.random() * 10,
                    inst.y + 25 + Math.random() * 10,
                );
                ctx.lineTo(
                    inst.x + 25 + Math.random() * 10,
                    inst.y - 25 + Math.random() * 10,
                );
                ctx.stroke();
                ctx.closePath();
                ctx.globalCompositeOperation = "source-over";
            }
        }
        if (placingInst) drawInstance(placingInst, ctx);

        // draw grid
        if ($roomStore.grid.enabled) {
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 1;
            ctx.globalCompositeOperation = "difference";
            ctx.beginPath();
            assert(gridWidth >= 1 && gridHeight >= 1);
            for (let x = 0; x < room.width; x += gridWidth) {
                ctx.moveTo(x + 0.5, 0);
                ctx.lineTo(x + 0.5, room.height);
            }
            for (let y = 0; y < room.height; y += gridHeight) {
                ctx.moveTo(0, y + 0.5);
                ctx.lineTo(room.width, y + 0.5);
            }
            ctx.stroke();
            ctx.closePath();
            ctx.globalCompositeOperation = "source-over";
        }
    }

    let mode = "place sprites";

    const tools = ["place", "delete", "play"] as (
        | "place"
        | "delete"
        | "play"
    )[];

    let iframeElement: HTMLIFrameElement | null = null;
    $: iframeLoadedPromise =
        iframeElement != null
            ? new Promise((r) => (iframeElement.onload = r))
            : null;

    async function reload() {
        if (!iframeElement) return;
        let resourceData = await $gameData.serialized();
        const messageData = {
            type: "dataUpdate",
            resourceData,
            startRoom: $roomStore,
        };
        iframeElement.contentWindow?.postMessage(messageData);
    }

    function selectTool(t: typeof tool) {
        tool = t;
        if(tool == "play") 
            reload();
    }

    

    // used in room editor
    function drawInstance(inst: Instance, ctx: CanvasRenderingContext2D) {
        // draw at x y sprite
        let sprite = $gameData.getResource(inst.spriteID, Sprite);
        
        if(sprite && sprite instanceof Sprite && sprite.canvas) {
            ctx.drawImage(sprite.canvas, inst.x - sprite.originX, inst.y - sprite.originY);
        } else {
            console.log(`sprite ${inst.spriteID} does not exist.`)
        }
    }

    function instanceIsValid(inst: Instance) {
        let sprite = $gameData.getResource(inst.spriteID, Sprite);
        return !!sprite;
    }
</script>

<!-- isMaximized is intentionally non-reactive, still a bit sussy, might not work as expected -->
<Card
    contentMinWidth={~~($roomStore.width / devicePixelRatio + 16)}
    namePrefix="edit room: "
    isMaximized={data.get().editor.settings.openResourcesMaximized}
    {card}
>
    <TabView tabs={["place sprites", "settings"]} bind:selected={mode} />
    {#if mode == "place sprites"}
        <h4 style:height="0">tools:</h4>
        <div class="toolbar" style:height="2.5rem">
            <!-- <span>tools: </span> -->
            {#each tools as t}
                <button
                    class:selected={tool == t}
                    class:emphasis={tool == t}
                    on:click={() => selectTool(t)}
                    style:vertical-align="middle"
                >
                    {t}
                    {#if t == "place"}
                        <div style:height="1.5rem" style:display="inline-block">
                            <SpriteIcon
                                spriteID={currentSpriteUUID}
                                growToFit
                            />
                        </div>
                    {:else if t == "play"}
                        <AtlasIcon id={72} height={20} />
                    {/if}
                </button>
            {/each}
        </div>
        {#if !currentSprite}
            <span> please select a sprite from the resource list.</span>
        {/if}

        <!-- {#if tool != "play"} -->
        <div class="room-edit">
            <div
                class="canvas-container"
                style:display={tool != "play" ? null : "none"}
            >
                <canvas
                    width={canvasWidth}
                    height={canvasHeight}
                    style:width="{canvasDisplayWidth}px"
                    style:height="{canvasDisplayHeight}px"
                    class="room-canvas"
                    bind:this={canvas}
                    on:mousedown={canvasMouseDown}
                    on:mousemove={canvasMouseMove}
                    on:mouseup={canvasMouseUp}
                    on:mouseleave={canvasMouseUp}
                />
            </div>

            {#await iframeLoadedPromise}
                <div
                    style:width="{canvasDisplayWidth}px"
                    style:height="{canvasDisplayHeight}px"
                    style:border="1px solid var(--main-color)"
                    style:font-size="large"
                    style:padding="2rem"
                    style:display={tool == "play" ? null : "none"}
                >
                    loading...
                </div>
            {:then _}
                <!--  -->
            {/await}

            <iframe
                title="gametest"
                src={getIFrameURL()}
                bind:this={iframeElement}
                style:width="{canvasDisplayWidth}px"
                style:height="{canvasDisplayHeight}px"
                style:display={tool == "play" ? null : "none"}
            />
        </div>
        <h4>
            {#if tool == "place"}
                <AtlasIcon id={41} height={12} /> select the current sprite from
                resource list. drag to place multiple.
            {:else if tool == "delete"}
                <AtlasIcon id={41} height={12} /> click sprites to delete them.
            {/if}
        </h4>
        <!-- {:else if tool == "play"} -->
        <!-- <Game startRoomUUID={$roomStore?.uuid}></Game> -->
        <!-- {/if} -->
    {:else if mode == "settings"}
        <div class="room-config">
            <label
                ><input
                    type="checkbox"
                    name="grid_enabled"
                    bind:checked={$roomStore.grid.enabled}
                /> grid
            </label>
            <label for="grid_width" hidden> width </label>
            <input
                name="grid_width"
                type="number"
                bind:value={$roomStore.grid.width}
            />
            x
            <label for="grid_height" hidden> height </label>
            <input
                name="grid_height"
                type="number"
                bind:value={$roomStore.grid.height}
            />
            <span class="spacer" />
            <label for="snap_mode">snap</label>
            <label
                ><input
                    type="radio"
                    value="center"
                    checked
                    bind:group={$roomStore.grid.snap}
                /> center
            </label>
            <label
                ><input
                    type="radio"
                    value="corner"
                    bind:group={$roomStore.grid.snap}
                /> corner
            </label>
            <!-- <span class="spacer" />
                <label for="background_color">background: </label><input name="background_color" type="color" bind:value={bgColor}/> -->
            <span class="spacer" />
            <label
                >bg color <input
                    type="color"
                    bind:value={$roomStore.backgroundColor}
                /></label
            >
            <label
                >width <input
                    type="number"
                    bind:value={$roomStore.width}
                /></label
            >
            <label
                >height <input
                    type="number"
                    bind:value={$roomStore.height}
                /></label
            >
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

    .room-config input[type="number"] {
        width: 3.5em;
    }

    label {
        vertical-align: middle;
        /* margin: auto 0; */
    }

    label > * {
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
