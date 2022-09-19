<script lang="ts">
import { onMount } from "svelte";
import Game from "../modules/game/game";
import { resourceManager } from "../modules/game/ResourceManager";
import * as database from "../modules/database";
import * as globalData from "./../modules/globalData";
import Sprite from "../modules/structs/sprite";
import Room from "../modules/structs/room";
import Folder from "../modules/structs/folder";
import Instance from "../modules/structs/instance";
// import { browser } from '$app/env';
// import { base } from '$app/paths';

    const browser = true;
    const base = ".";
    
    let init = async () => {
        if(!browser) return;
        console.log("--- loading start ---")
        // initialize different modules
        await database.init([Sprite, Room, Folder, Instance]);
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

    let canvas: HTMLCanvasElement|null;
    let game: Game|null;

    $: (canvas && !game)? reload() : null

    $: canvasWidth = canvas?.width || 100;
    $: canvasHeight = canvas?.height || 100;
    const scaleFactor = 1;
    const ratio = browser? window.devicePixelRatio : 1;
    $: canvasDisplayWidth = canvasWidth / ratio * scaleFactor;
    $: canvasDisplayHeight = canvasHeight / ratio * scaleFactor; 


    function reload() {
        if(!canvas) return;
        if(game) game.quit();
        game = new Game(resourceManager.get(), canvas);
        canvas = canvas;
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
            reload();
        }
    }

    onMount(() => {
        window.onmessage = onMessage;
    })

    function windowOnKeyDown(event: KeyboardEvent) {
        if(event.key == "r")
            reload()
    }
</script>

<svelte:head>
    <title>trash engine</title>
    <link rel="stylesheet" href="{base}/reset.css">
    <link rel="stylesheet" href="{base}/main.css"> 
</svelte:head>

<!-- <svelte:window on:message={onMessage} /> -->
<svelte:window on:keydown={windowOnKeyDown} />

{#await initPromise}
    <p>loading...</p>
{:then}
    <canvas 
        bind:this={canvas} 
        style:width={canvasDisplayWidth}px 
        style:height={canvasDisplayHeight}px
    ></canvas>
{/await}

<style>
    canvas {
        margin: auto;
        border: 1px solid #888;
    }
</style>