
<script lang="ts">
import { onMount } from "svelte";
    import type { Writable } from "svelte/store";
import { resourceManager } from "../modules/game/ResourceManager";
import { adjustedCanvasSize } from "../modules/game/utils";
import type Sprite from "../modules/structs/sprite";
    
    export let spriteID: string;
    export let growToFit: boolean = true;
    let myCanvas: HTMLCanvasElement;

    let s_sprite = $resourceManager.getResourceStore(spriteID) as Writable<Sprite>;

    // $: {$resourceManager; sprite = sprite;} // small reactivity hack, resource manager change triggers sprite change
    $: width = $s_sprite.canvas?.width || 1
    $: height = $s_sprite.canvas?.height || 1
    $: {$s_sprite; redraw();}

    $: adjWidth = adjustedCanvasSize(width);
    $: adjHeight = adjustedCanvasSize(height);
    
    function redraw() {
        if(myCanvas && $s_sprite.canvas) {
            myCanvas.width = $s_sprite.canvas.width;
            myCanvas.height = $s_sprite.canvas.height;
            let ctx = myCanvas.getContext("2d")!;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage($s_sprite.canvas, 0, 0);
        }
    }

    onMount(() => redraw())
</script>


<canvas 
    {width} 
    {height} 
    bind:this={myCanvas}
    style:width={growToFit? (width > height? '100%' : null) : adjWidth}
    style:height={growToFit? (height >= width? '100%' : null) : adjHeight}
></canvas>
