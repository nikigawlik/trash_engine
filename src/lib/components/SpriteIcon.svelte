
<script lang="ts">
import { onMount } from "svelte";
import { gameData } from "../modules/game/game_data";
import { adjustedCanvasSize } from "../modules/game/utils";
import { asStore } from "../modules/store_owner";
import Sprite from "../modules/structs/sprite";
    
    export let spriteID: string;
    export let growToFit: boolean = true;
    export let maxWidth: number = 9999;
    export let maxHeight: number = 9999;

    let myCanvas: HTMLCanvasElement;

    $: sprite = asStore($gameData.getResource(spriteID, Sprite))

    $: width = $sprite.canvas?.width || 1
    $: height = $sprite.canvas?.height || 1
    $: {$sprite; redraw();}

    $: adjWidth = adjustedCanvasSize(Math.min(maxWidth, width));
    $: adjHeight = adjustedCanvasSize(Math.min(maxHeight, height));
    
    function redraw() {
        if(myCanvas && $sprite.canvas) {
            myCanvas.width = $sprite.canvas.width;
            myCanvas.height = $sprite.canvas.height;
            let ctx = myCanvas.getContext("2d")!;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage($sprite.canvas, 0, 0);
        }
    }

    onMount(() => redraw())
</script>


<canvas 
    {width} 
    {height} 
    bind:this={myCanvas}
    style:width={growToFit? (width > height? '100%' : null) : `${adjWidth}px`}
    style:height={growToFit? (height >= width? '100%' : null) : `${adjHeight}px`}
></canvas>
