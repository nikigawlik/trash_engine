<script lang="ts">
import "../../assets/reset.css";
import { onMount } from "svelte";
import * as database from "../modules/database";
import Game from "../modules/game/game";
import { resourceManager } from "../modules/game/ResourceManager";
import { nameConstructorMap } from "../modules/structs/savenames";
import * as globalData from "./../modules/globalData";
import p5 from "../ext/p5.js";

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

    let canvas: HTMLCanvasElement|null;
    let game: Game|null;

    $: (canvas && !game)? reload() : null

    $: canvasWidth = canvas? canvas.width : 100;
    $: canvasHeight = canvas? canvas.height : 100;
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