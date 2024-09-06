<script lang="ts">
    import AtlasIcon from "../components/AtlasIcon.svelte";
    import * as database from "../modules/database";
    import { gameData } from "../modules/game/game_data";
    import { makeSpriteMap } from "../modules/game/renderer";
    import { autoLoadGameData } from "../modules/game/save_load";
    import Sprite from "../modules/structs/sprite";

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
        console.log("load app...");
        await database.init();
        // await globalData.load();
        await autoLoadGameData();
        // await image_editor.init();
        console.log("--- loading done ---") 
        spriteMap = makeSpriteMap($gameData.getAllOfResourceType(Sprite));
    }

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