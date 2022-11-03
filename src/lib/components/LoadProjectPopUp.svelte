<script lang="ts">
    import { onMount } from "svelte";
    import ResourceManager, { resourceManager } from "../modules/game/ResourceManager";
    
    import type { AbstractPrompt } from "../modules/ui";
    import BlockingPopUp from "./BlockingPopUp.svelte";
    import SelectMenu from "./SelectMenu.svelte";
    
        export let prompt: AbstractPrompt|null;
        
        $: if(prompt) prompt.buttons = [
            {text: "load", callback: () => prompt?.resolve(currentSelected), disabled: !currentSelected},
            {text: "cancel", callback: () => prompt?.resolve(null)},
        ]
        $: prompt.text = "";

        let currentSelected = null;

        let saveFilesPromise = getSaveFiles();

        async function getSaveFiles() {
            console.log(`- load resource tree from indexed db...`)
            try {
                let files = await ResourceManager.getSaveFiles();
                let results = files.map((x, i) => ({
                    name: `${x.value.settings?.title}` as string,
                    id: x.key as number,
                }));
                results.unshift(currentSelected)

                return results;
            } catch (e) {
                console.log(`getting data failed: ${(e as Error)?.message}`);
                return [];
            }
        }
    
        // onMount(() => {
        //     inputElmt.focus();
        //     inputElmt.select();
        // });
        
        // let onkeyup = (event: KeyboardEvent) => {
        //     if (event.key == 'Enter') {
        //         prompt?.resolve(text);
        //         prompt = null;
        //     } 
        // }
    </script>
    
    <BlockingPopUp bind:prompt={prompt}>
        <div class="container">
            <h3>load project...</h3>
            {#await saveFilesPromise}
            <h4>loading existing saves...</h4>
            {:then saveFiles}
                <SelectMenu options={saveFiles} bind:currentSelected={currentSelected}></SelectMenu>
            {/await}
        </div>
    </BlockingPopUp>

    <style>
        .container {
            width: 15rem;
        }
    </style>