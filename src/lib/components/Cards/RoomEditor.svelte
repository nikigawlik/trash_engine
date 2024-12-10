<script lang="ts">
    import Instance from "../../modules/structs/instance";

    import {
        adjustedCanvasSize,
        assert,
        rectInside,
        rectIntersect,
    } from "../../modules/game/utils";
    import Room from "../../modules/structs/room";
    import Sprite from "../../modules/structs/sprite";

    import { afterUpdate, tick } from "svelte";
    import { openCard, type CardInstance } from "../../modules/cardManager";
    import { gameData } from "../../modules/game/game_data";
    import { asStore } from "../../modules/store_owner";
    import AtlasIcon from "../AtlasIcon.svelte";
    import Card from "../Card.svelte";
    import SpriteEditor from "../Cards/SpriteEditor.svelte";
    import MultiSelect from "../MultiSelect.svelte";
    import RoomSettings from "../RoomSettings.svelte";
    import SpriteIcon from "../SpriteIcon.svelte";
    import { getIFrameURL } from "./GamePreview.svelte";

    export let card: CardInstance;
    const uuid = card.uuid;

    $: room = asStore($gameData.getResource(uuid, Room) || $gameData.getAllOfResourceType(Room)[0]);
    $: { if($room) card.uuid = $room.uuid }
    $: card.name = $room?.name || "room not loaded";

    let canvas: HTMLCanvasElement;

    let sprites = [] as Sprite[];
    $gameData
        .getResourceTypeStore(Sprite)
        .subscribe((value) => (sprites = value));

    let currentSpriteUUID: string | null =
        sprites.length > 0 ? sprites[0].uuid : null;

    $: currentSprite =
        currentSpriteUUID &&
        ($gameData.getResource(currentSpriteUUID, Sprite) as Sprite | null);

    $: gridWidth = Math.max($room?.grid.width, 1);
    $: gridHeight = Math.max($room?.grid.height, 1);

    // default for when room is not loaded
    $: canvasWidth = $room?.width || 100;
    $: canvasHeight = $room?.height || 100;

    $: canvasDisplayWidth = adjustedCanvasSize(canvasWidth);
    $: canvasDisplayHeight = adjustedCanvasSize(canvasHeight);

    afterUpdate(() => {
        refresh(false);
    });

    let instancesUnderCursor = new WeakSet<Instance>();

    let prevX = 0;
    let prevY = 0;
    // placing / deleting etc.
    function canvasUpdate(evt: MouseEvent | DragEvent, isDownEvent: boolean) {
        if (!room) return;

        const inputX = evt.offsetX * (canvas.width / canvasDisplayWidth);
        const inputY = evt.offsetY * (canvas.height / canvasDisplayHeight);

        let mousepos = new DOMRect(inputX, inputY, 0, 0);

        // update the weakset of the instances under the cursor (candidates for deletion)
        instancesUnderCursor = new WeakSet();

        for (let inst of $room.instances) {
            const rect = getBBRect(inst);
            if (rect && rectInside(mousepos, rect))
                instancesUnderCursor.add(inst);
        }

        let filteredInstances = $room.instances.filter(
            (inst) => !instancesUnderCursor.has(inst),
        );

        let { x, y } = getPlacementPos(inputX, inputY);
        let moved = !!(prevX - x) || !!(prevY - y);

        if (moved)
            if (placingInst == null)
                placingInst = new Instance(currentSpriteUUID, x, y);

        let canDeleteSomething =
            tool == "edit" &&
            filteredInstances.length != $room.instances.length &&
            !(evt instanceof DragEvent); // exception for when dragging

        let deleteSomething =
            canDeleteSomething && (isDownEvent || moved) && isMouseDown;
        // (isMouseDown || isDownEvent)

        if (deleteSomething) {
            $room.instances = filteredInstances;
            $room = $room;
            placingInst = null; // cant place directly after delete (bad UX)
        }

        // place something
        if (tool == "edit" && placingInst) {
            placingInst.x = x;
            placingInst.y = y;

            let alreadyExists = $room.instances.find(
                (inst) =>
                    inst.spriteID == currentSprite.uuid &&
                    rectIntersect(getBBRect(inst), getBBRect(placingInst)),
            );

            if (
                (isMouseDown || isDownEvent) &&
                currentSprite &&
                (!alreadyExists || isDownEvent)
            ) {
                $room.instances.push(placingInst);
                $room = $room;
                placingInst = new Instance(currentSpriteUUID, x, y);
            }
        } else {
            placingInst = null;
        }

        prevX = x;
        prevY = y;

        refresh(canDeleteSomething);
    }
    function getBBRect(inst: Instance) {
        let sprite = $gameData.getResource(inst.spriteID, Sprite);
        return sprite
            ? new DOMRect(
                  inst.x - sprite.originX + sprite.bBoxX,
                  inst.y - sprite.originY + sprite.bBoxY,
                  sprite.bBoxWidth,
                  sprite.bBoxHeight,
              )
            : null;
    }

    $: placingInst =
        tool == "edit" ? new Instance(currentSpriteUUID, -10000, 0) : null;

    function getPlacementPos(inputX: number, inputY: number) {
        let x: number, y: number;
        if (!$room?.grid.enabled) {
            x = Math.floor(inputX);
            y = Math.floor(inputY);
        } else if ($room?.grid.snap == "center") {
            x = (Math.floor(inputX / gridWidth) + 0.5) * gridWidth;
            y = (Math.floor(inputY / gridHeight) + 0.5) * gridHeight;
        } else if ($room?.grid.snap == "corner") {
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

    type RETool = "edit" | "play";

    const tools = ["edit", "play"] as RETool[];

    let tool: RETool = "edit";

    function onSelectTool(tool: string) {
        if (tool == "play") {
            (async () => {
                await tick();
                iframeElement.contentWindow.focus();
            })();
            reload();
        }
    }

    let showSettings = false;

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

    function canvasMouseLeave(evt: MouseEvent) {
        placingInst = null;
        isMouseDown = false;
        refresh(false);
    }

    function canvasDrag(evt: DragEvent, isDrop: boolean) {
        let otherUUID = evt.dataTransfer?.getData("text/uuid");
        if (!otherUUID) return;

        let resource = $gameData.getResource(otherUUID, Sprite);
        if (resource) {
            currentSpriteUUID = otherUUID;
            canvasUpdate(evt, isDrop);
            evt.preventDefault();
            if (isDrop) console.log("sprite dropped!");
        }
    }

    function refresh(canDeleteSomething: boolean) {
        /** @type {CanvasRenderingContext2D} */
        if (!$room || !$room) return;
        let ctx = canvas?.getContext("2d")!;
        if (!ctx) return;

        ctx.fillStyle = $room.backgroundColor;
        ctx.fillRect(0, 0, $room.width, $room.height);

        for (let i = $room.instances.length - 1; i >= 0; i--) {
            const inst = $room.instances[i];
            if (!instanceIsValid(inst)) {
                $room.instances.splice(i, 1);
                $room.instances = $room.instances; // for reactivity
            }
        }

        let isDeleting = false;
        for (let inst of $room.instances) {
            drawInstance(inst, ctx);
            if (instancesUnderCursor.has(inst) && canDeleteSomething) {
                drawCross(ctx, inst);
                isDeleting = true;
            }
        }
        if (placingInst && !isDeleting) drawInstance(placingInst, ctx);

        // draw grid
        if ($room.grid.enabled) {
            drawGrid(ctx, $room.grid.snap);
        }
    }

    let mode = "place sprites";

    let iframeElement: HTMLIFrameElement | null = null;
    $: iframeLoadedPromise =
        iframeElement != null
            ? new Promise((r) => (iframeElement.onload = r))
            : null;

    function drawCross(ctx: CanvasRenderingContext2D, inst: Instance) {
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

    function drawGrid(
        ctx: CanvasRenderingContext2D,
        snapType: "corner" | "center",
    ) {
        if (!$room || !$room) return;
        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        ctx.globalCompositeOperation = "difference";
        ctx.beginPath();
        assert(gridWidth >= 1 && gridHeight >= 1);
        if (snapType == "center") {
            for (let x = 0; x < $room.width; x += gridWidth) {
                ctx.moveTo(x + 0.5, 0);
                ctx.lineTo(x + 0.5, $room.height);
            }
            for (let y = 0; y < $room.height; y += gridHeight) {
                ctx.moveTo(0, y + 0.5);
                ctx.lineTo($room.width, y + 0.5);
            }
        } else {
            const d = 8;
            for (let x = 0; x <= $room.width; x += gridWidth)
                for (let y = 0; y <= $room.height; y += gridHeight) {
                    ctx.moveTo(x, y - d);
                    ctx.lineTo(x, y + d);
                    ctx.moveTo(x - d, y);
                    ctx.lineTo(x + d, y);
                }
        }
        ctx.stroke();
        ctx.closePath();
        ctx.globalCompositeOperation = "source-over";
    }

    async function reload() {
        if (!iframeElement) return;
        let resourceData = await $gameData.serialized();
        const messageData = {
            type: "dataUpdate",
            resourceData,
            startRoom: $room.uuid,
        };
        iframeElement.contentWindow?.postMessage(messageData);
    }

    // used in room editor
    function drawInstance(inst: Instance, ctx: CanvasRenderingContext2D) {
        // draw at x y sprite
        let sprite = $gameData.getResource(inst.spriteID, Sprite);

        if (sprite && sprite instanceof Sprite && sprite.canvas) {
            ctx.drawImage(
                sprite.canvas,
                inst.x - sprite.originX,
                inst.y - sprite.originY,
            );
        } else {
            console.log(`sprite ${inst.spriteID} does not exist.`);
        }
    }

    function instanceIsValid(inst: Instance) {
        let sprite = $gameData.getResource(inst.spriteID, Sprite);
        return !!sprite;
    }
</script>

<!-- isMaximized is intentionally non-reactive, still a bit sussy, might not work as expected -->
 <!-- 
    contentMinWidth={($room && $room)? ~~($room.width / devicePixelRatio + 16) : 200}
    isMaximized={data.get().editor.settings.openResourcesMaximized}
     -->
<Card
    namePrefix="room - "
    {card}
    resourceNeeded={($room && $room)? null : {displayName: "room", resourceConstructor: Room}}
>
    <!-- Tool / Mode Select -->
    <MultiSelect
        bind:value={tool}
        options={tools}
        onSelect={onSelectTool}
        let:option
    >
        <AtlasIcon
            height={20}
            id={{ play: 75, edit: 42, settings: 43 }[option]}
        />
        <!-- <span style:font-size="var(--size-4)" style:line-height="var(--size-4)">{option}</span> -->
        {option != "settings" ? option : ""}
    </MultiSelect>

    {#if tool == "edit"}
        <!-- Sprite Select -->
        <div
            style:overflow-x="scroll"
            style:width="{canvasDisplayWidth}px"
            style:min-height="var(--size-9)"
        >
            <MultiSelect
                bind:value={currentSpriteUUID}
                options={sprites.map((s) => s.uuid)}
                onSelect={(v) => {
                    if (currentSpriteUUID == v)
                        openCard(SpriteEditor, currentSpriteUUID);
                }}
                let:option
                style="align-items: end; padding-bottom:var(--size-2);"
            >
                <div
                    style:height="fit-content"
                    draggable="true"
                    on:dragstart={(evt) =>
                        evt.dataTransfer?.setData("text/uuid", option)}
                >
                    <SpriteIcon
                        spriteID={option}
                        growToFit={false}
                        maxHeight={60}
                        maxWidth={60}
                    />
                </div>
            </MultiSelect>
        </div>
        <div style="padding: var(--size-1) 0">
            <!-- ><AtlasIcon height={20} id={43} /></button -->
            <button
                class="borderless"
                on:click={() => (showSettings = !showSettings)}
                ><AtlasIcon height={15} id={showSettings? 7: 43} /> settings </button
            >
        </div>
    {/if}

    {#if showSettings}
        <!-- style="width: {canvasDisplayWidth}px;" -->
        <RoomSettings roomStore={room} />
    {/if}

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
                on:mouseleave={canvasMouseLeave}
                on:dragover={(evt) => canvasDrag(evt, false)}
                on:drop={(evt) => canvasDrag(evt, true)}
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
        {#if tool == "edit"}
            <AtlasIcon id={41} height={12} /> select the current sprite from resource
            list. drag to place multiple.
        {/if}
    </h4>
    <!-- {:else if tool == "play"} -->
    <!-- <Game startRoomUUID={$room?.uuid}></Game> -->
    <!-- {/if} -->
</Card>

<style>
    /* 
    button:active {
        transform: none;
    } */

    .room-edit {
        flex: 1 0 120px;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        min-width: 0;
    }

    .canvas-container {
        overflow: scroll;
        flex-shrink: 1;
    }

    .canvas-container canvas {
        /* display: block; */
        border: 1px dashed var(--main-color);
    }
</style>
