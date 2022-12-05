<script lang="ts">
    import type { SvelteComponentDev } from "svelte/internal";
    import { resourceManager } from "../modules/game/ResourceManager";
    import Behaviour from "../modules/structs/behaviour";
import type { AbstractPrompt } from "../modules/ui";
    import BCustom from "./behaviours/BCustom.svelte";
    import BPlayerController from "./behaviours/BPlayerController.svelte";
import BlockingPopUp from "./BlockingPopUp.svelte";
import BehaviourLink from "../modules/structs/behaviourLink"

    export let prompt: AbstractPrompt|null;

    interface BehOpt {
        text: string,
        behaviourComp?: typeof SvelteComponentDev,
        linkedBehaviour?: Behaviour
    }
    
    let defaultOptions: BehOpt[] = [
        { text: "player controller", behaviourComp: BPlayerController },
        { text: "custom code", behaviourComp: BCustom },
    ];

    let additionalOptions: BehOpt[] = resourceManager.get().getBehaviours().map(x => ({
        text: `s: ${x.name}`,
        linkedBehaviour: x,
    }));

    let options = defaultOptions.concat(additionalOptions);

    let selectedID: number;
    $: selected = options[selectedID]
    
    $: if(prompt) prompt.buttons = [
        {text: "ok", callback: () => {
            let b: Behaviour;
            if(selected.linkedBehaviour) {
                b = new BehaviourLink(selected.linkedBehaviour.uuid);
            } else {
                b = new Behaviour(selected.text);
                b.svelteComponent = selected.behaviourComp;
            }
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