<script lang="ts">
    import Behaviour from "../modules/game/behaviour";
import type { AbstractPrompt } from "../modules/ui";
    import BCustom from "./behaviours/BCustom.svelte";
    import BPlayerController from "./behaviours/BPlayerController.svelte";
import BlockingPopUp from "./BlockingPopUp.svelte";

    export let prompt: AbstractPrompt|null;
    
    let options = [
        {text: "player controller", behaviourComp: BPlayerController},
        {text: "custom", behaviourComp: BCustom},
    ];

    let selectedID: number;
    $: selected = options[selectedID]
    
    $: if(prompt) prompt.buttons = [
        {text: "ok", callback: () => {
            let b = new Behaviour(selected.text);
            b.svelteComponent = selected.behaviourComp;
            prompt?.resolve(b);
        }},
        {text: "cancel", callback: () => prompt?.resolve(null)},
    ]
</script>


<BlockingPopUp bind:prompt={prompt}>
    <p>Choose behaviour to add:</p>
    <select bind:value={selectedID}>
        {#each options as opt, i}
            <option value={i}>{opt.text}</option>
        {/each}
    </select>
</BlockingPopUp>