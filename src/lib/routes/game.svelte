<script lang="ts">
import "../../assets/reset.css";
import { onMount } from "svelte";
import * as database from "../modules/database";
import Game from "../modules/game/game";
import { resourceManager } from "../modules/game/ResourceManager";
import { nameConstructorMap } from "../modules/structs/savenames";
import * as globalData from "./../modules/globalData";
    import { adjustedCanvasSize } from "../modules/game/utils";

    // TODO lot's of code overlap with index.svelte

    const browser = true;
    
    let init = async () => {
        if(!browser) return;
        console.log("--- loading start ---")
        // initialize different modules
        await database.init(nameConstructorMap);
        // await ResourceManager.init();
        {
            console.log("load app...");
            await globalData.load();
            await resourceManager.get().load();
        }
        // await SaveSystem.init();
        console.log("--- --- ---- --- ---")
        console.log("--- loading done ---")
        console.log("--- --- ---- --- ---")
    };

    let initPromise = init();

    let canvasWebgl: HTMLCanvasElement|null;
    let canvas2d: HTMLCanvasElement|null;
    let game: Game|null;

    let requestEditorOpen = false;

    $: (canvasWebgl && !game)? reload() : null

    $: canvasWidth = canvasWebgl? canvasWebgl.width : 0;
    $: canvasHeight = canvasWebgl? canvasWebgl.height : 0;
    $: canvasDisplayWidth = adjustedCanvasSize(canvasWidth);
    $: canvasDisplayHeight = adjustedCanvasSize(canvasHeight);

    $: {
        if(canvasDisplayHeight && canvasDisplayWidth)
            sendSizeUpdate();
    }


    let startRoom: string = null;

    function sendSizeUpdate() {
        let parent = window.parent;
        if(parent) {
            parent.postMessage({
                type: "canvasSizeUpdate",
                displayWidth: canvasDisplayWidth,
                displayHeight: canvasDisplayHeight,
            })
            console.log("send game resize message")
        }
    }

    let currentError: Error|null = null;
    let onErrorRestartClick = null;
    let onErrorContinueClick = null;

    function reload() {
        if(!canvasWebgl || !canvas2d) return;
        if(game) {
            game.quitGameCallback = null;
            game.quit();
        }
        game = new Game(resourceManager.get(), canvasWebgl, canvas2d, startRoom);
        game.registerEditorCallback(requestOpenEditor);
        game.quitGameCallback = () => reload(); // for quitting in game
        game.errorCallback = async(e: Error)=> {
            currentError = e;
            let result = await new Promise<boolean>((resolve) => {
                onErrorRestartClick = () => resolve(true);
                onErrorContinueClick = () => resolve(false);
            });
            onErrorContinueClick = onErrorRestartClick = null;
            currentError = null;
            return result;
        };
        canvasWebgl = canvasWebgl;
        // canvas2d = canvas2d;
    }

    function requestOpenEditor() {
        requestEditorOpen = true;
    }

    function getEditorHREF() {
        let url = new URL(location.href);
        url.searchParams.delete("game");
        url.searchParams.set("editor", "");
        return url.href;
    }

    async function onMessage(msg: MessageEvent) {
        let data = msg.data;
        if(!data.type) return;
        console.log(`received ${data.type}`)
        if(data.type == "reload") {
            reload();
        } else 
        if(data.type == "dataUpdate") {
            await resourceManager.get().setFromSerializedData(data.resourceData);
            startRoom = data.startRoom;
            reload();
        }
    }

    onMount(() => {
        window.onmessage = onMessage;
    })

    function windowOnKeyDown(event: KeyboardEvent) {
        // if(event.code == "KeyR")
        //     reload()
    }
</script>

<!-- <svelte:window on:message={onMessage} /> -->
<svelte:window on:keydown={windowOnKeyDown} />
<svelte:head>
    <title>{$resourceManager.settings.title}</title>
</svelte:head>

{#await initPromise}
    <p>loading...</p>
{:then}
<div class="contains-main">
    <main>
        <canvas 
            class="canvas-2d"
            bind:this={canvas2d} 
            style:width={canvasDisplayWidth}px 
            style:height={canvasDisplayHeight}px
            width={canvasWidth}
            height={canvasHeight}
        ></canvas>
        <div
            class="text-overlay"
            style:width={canvasDisplayWidth}px 
            style:height={canvasDisplayHeight}px
        >
            <!-- <div class="centered"></div> -->
            {#if requestEditorOpen}
            <section class="request-editor-overlay">    
                <p>(use mouse)</p>
                <p><a href={ getEditorHREF() }>remix game</a></p>
                <p><button on:click={() => requestEditorOpen = false}>no thanks</button></p>
            </section>
            {/if}
            {#if currentError}
            <section class="error-msg">
                <p>The game encountered an error: </p>
                <p>{currentError.message}</p>
                <button on:click={onErrorRestartClick}>restart game</button>
                <button on:click={onErrorContinueClick}>continue</button>
            </section>
            {/if}
        </div>
        <canvas 
            class="canvas-webgl"
            bind:this={canvasWebgl} 
            style:width={canvasDisplayWidth}px 
            style:height={canvasDisplayHeight}px
        ></canvas>
    </main>
</div>
{/await}

<style>
    .contains-main {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-items: center;;
    }

    main {
        margin: auto;
        /* border: 1px solid #888; */
    }

    .canvas-2d, .text-overlay {
        position: absolute;
        color: white;
    }

    /* .text-overlay {
    } */

    .request-editor-overlay {
        width: 100%;
        height: 100%;
        background-color: var(--bg-color);
        color: var(--main-color);
        display: flex;
        align-items: center;
        justify-items: center;
        flex-direction: column;
        justify-content: center;
        gap: 1rem;
    }
</style>