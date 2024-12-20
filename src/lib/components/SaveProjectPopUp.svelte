<script lang="ts">
        
    import type { AbstractPrompt } from "../modules/ui";
    import BlockingPopUp from "./BlockingPopUp.svelte";
    import SelectMenu from "./SelectMenu.svelte";
    
        export let prompt: AbstractPrompt|null;
        
        $: if(prompt) prompt.buttons = [
            {text: "save", callback: () => prompt?.resolve(currentSelected)},
            {text: "cancel", callback: () => prompt?.resolve(null)},
        ]
        $: prompt.text = "";
    
        let text: string = "";

        let currentSelected = {
            name: "new save file",
            id: -1,
        };

        let saveFilesPromise = getSaveFiles();

        async function getSaveFiles() {
            //throw new Error("not implemented!")
            
            // TODO delete
            return [];
            // console.log(`- load resource tree from indexed db...`)
            // try {
            //     let files = await ResourceManager.getSaveFiles();
            //     let results = files.map((x, i) => ({
            //         name: `${x.value.settings?.title}` as string,
            //         id: x.key as number,
            //     }));
            //     results.unshift(currentSelected)

            //     return results;
            // } catch (e) {
            //     console.log(`getting data failed: ${(e as Error)?.message}`);
            //     return [];
            // }
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
        <h3>save project...</h3>
        {#await saveFilesPromise}
        <h4>loading existing saves...</h4>
        {:then saveFiles}
            <SelectMenu options={saveFiles} bind:currentSelected={currentSelected}></SelectMenu>
            {#if currentSelected && currentSelected.id >= 0}
            <p class="confirmText">replace <em>{currentSelected.id} - {currentSelected.name}</em>?</p> 
            {:else}
            <p class="confirmText">&nbsp;</p>
            {/if}
        {/await}
    </div>
</BlockingPopUp>

<style>
    .container {
        width: 15rem;
    }
    
    .confirmText {
        /* font-size: small; */
        /* font-style: italic; */
        /* font-weight: bolder; */
        /* width: 100%; */
        overflow: hidden;
        white-space: nowrap;
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
    }

    em {
        text-decoration: underline;
    }
</style>