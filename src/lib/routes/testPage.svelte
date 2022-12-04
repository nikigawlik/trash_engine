<script lang="ts">
    import AtlasIcon from "../components/AtlasIcon.svelte";
    import * as database from "../modules/database";
    import { makeSpriteMap } from "../modules/game/renderer";
    import { resourceManager } from "../modules/game/ResourceManager";
    import { nameConstructorMap } from "../modules/structs/savenames";
    import type Sprite from "../modules/structs/sprite";

    let canvas: HTMLCanvasElement = null;
    let spriteMap = null;

    $: {
        if(canvas && spriteMap) {
            canvas.width = spriteMap.canvas.width;
            canvas.height = spriteMap.canvas.height
            canvas.getContext("2d").drawImage(spriteMap.canvas, 0, 0);
        }
    }


    let init = async () => {
        console.log("--- window.onload ---")
        // initialize different modules
        await database.init(nameConstructorMap);
        console.log("load app...");
        // await globalData.load();
        await resourceManager.get().load();
        // await image_editor.init();
        console.log("--- loading done ---") 
        spriteMap = makeSpriteMap($resourceManager.getSprites());
    }

    // let dbPromise = database.init();
    // let setupPromise = Promise.all([dbPromise, resourceManager.waitForLoad()])
    let setupPromise = init();

</script>

<section>
    <h2>icons:</h2>
    <table>
        {#each (new Array(7)) as _, row}
            <tr>
                {#each (new Array(15)) as _, column}
                    {@const id = row*15 + column}
                    <td> <AtlasIcon {id} height={32}></AtlasIcon> {id} </td>
                {/each}
            </tr>
        {/each}
    </table>
    {#await setupPromise then}
        <canvas bind:this={canvas}></canvas>
    {/await}
</section>

<style>
    h2 {
        margin: 1rem;
    }

    section {
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        place-items: center baseline;
    }

    table {
        width: 16rem;
        border-collapse: collapse;
    }
    td {
        border: 1px solid var(--main-color);
    }
</style>