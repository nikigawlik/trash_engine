<script lang="ts">
import { onMount } from "svelte";
import licenseText from "../../../LICENSE?raw";
import "../../assets/reset.css";
import * as database from "../modules/database";
import Game from "../modules/game/game";
import { gameData } from "../modules/game/game_data";
import { autoLoadGameData, loadGameData } from "../modules/game/save_load";
import { adjustedCanvasSize } from "../modules/game/utils";
import { asStore } from "../modules/store_owner";
import * as globalData from "./../modules/globalData";

    // TODO lot's of code overlap with index.svelte

    const browser = true;
    
    let init = async () => {
        if(!browser) return;
        console.log("--- loading start (game) ---")
        
        // initialize different modules
        await database.init(true);
        
        console.log("load app...");
        await globalData.load();
        await autoLoadGameData();
        
        console.log("--- loading done ---")
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


    export let startRoomUUID: string = null;

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

    function sendLoadedMessage() {
        let parent = window.parent;
        if(parent) {
            parent.postMessage({
                type: "engineLoaded",
            })
            console.log("send engine loaded message")
        }
    }

    let currentError: Error|null = null;
    let onErrorRestartClick = null;
    let onErrorContinueClick = null;

    let htmlOverlay: HTMLDivElement|null = null;

    function reload() {
        if(!canvasWebgl || !canvas2d) return;
        currentError = null;
        if(game) {
            game.quitGameCallback = null;
            game.quit();
        }
        try {
            game = new Game($gameData, canvasWebgl, canvas2d, htmlOverlay, startRoomUUID);
        } catch (e) {
            currentError = e;
            console.error(e);
            game = null;
            return;
        }
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
            await loadGameData(data.resourceData);
            startRoomUUID = data.startRoom;
            reload();
        }
    }

    onMount(async () => {
        window.onmessage = onMessage;

        await initPromise;
        sendLoadedMessage();
    })

    function windowOnKeyDown(event: KeyboardEvent) {
        // if(event.code == "KeyR")
        //     reload()
    }

    $: hasFocus = document.hasFocus();

    function documentOnFocus() { hasFocus = true; }
    function documentOnBlur() { hasFocus = false; }

    $: console.log(`focus: ${hasFocus? "yes" : "no"}`)
    
    $: settings = asStore($gameData?.settings, "gameData.settings");
</script>

<!-- <svelte:window on:message={onMessage} /> -->
<svelte:document on:focus={documentOnFocus} on:blur={documentOnBlur}></svelte:document>
<svelte:window on:keydown={windowOnKeyDown} on:focus={documentOnFocus} on:blur={documentOnBlur}/>
<svelte:head>
    <title>{$settings?.title || "loading..."}</title>
    {@html `<!-- ${licenseText} -->`}
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
            {#if !hasFocus}
            <section class="error-msg">
                <p>please click me to activate the game view</p>
            </section>
            {/if}
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
            <div class="gametext" bind:this={htmlOverlay}></div>
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

    /* .text-overlay { */
        /* display: flex; */
        /* justify-content: center;
        align-items: center; */
    /* } */

    .gametext {
        font-size: 2rem;
        text-shadow: .2rem .2rem black;

        -webkit-user-select: none;  
        -moz-user-select: none;    
        -ms-user-select: none;      
        user-select: none;
    }

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

    .error-msg, .error-msg>button {
        background-color: black;
        color: white;
        font-family: monospace;
    }

    .error-msg {
        padding: .3rem;
    }

    .error-msg>button {
        border: 1px solid white;
        margin: .15rem;
    }

    .error-msg>button:hover {
        background-color: #333;
    }
    .error-msg>button:active {
        background-color: white;
        color: black;
    }

</style>