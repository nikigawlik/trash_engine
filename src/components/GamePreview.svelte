<script lang="ts">
import { onMount } from "svelte";

import type { CardInstance } from "../modules/cardManager";
import Game from "../modules/game/game";
import { resourceManager } from "../modules/game/ResourceManager";
import Card from "./Card.svelte";

    export let card: CardInstance;
    $: card.name = "game preview";

    let canvas: HTMLCanvasElement;
    let game: Game|null;

    $: canvasWidth = canvas?.width || 100;
    $: canvasHeight = canvas?.height || 100;
    const scaleFactor = 1;
    $: canvasDisplayWidth = canvasWidth / window.devicePixelRatio * scaleFactor;
    $: canvasDisplayHeight = canvasHeight / window.devicePixelRatio * scaleFactor; 

    onMount(() => {
        game = new Game(resourceManager.get(), canvas);
        canvas = canvas;

        return () => game?.quit();
    });

    function reload() {
        game = new Game(resourceManager.get(), canvas);
        canvas = canvas;
    }

</script>

<Card {card}>
    <p><button on:click={reload}>reload ↺</button></p>
    <canvas bind:this={canvas} style:width={canvasDisplayWidth}px style:height={canvasDisplayHeight}px></canvas>
</Card>