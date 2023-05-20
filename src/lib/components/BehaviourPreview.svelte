<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { cards, openCard } from "../modules/cardManager";
    import { resourceManager } from "../modules/game/ResourceManager";
    import type Behaviour from "../modules/structs/behaviour";
    import BehaviourLink from "../modules/structs/behaviourLink";
    import type Sprite from "../modules/structs/sprite";
    import { asyncYesNoPopup } from "../modules/ui";
    import AtlasIcon from "./AtlasIcon.svelte";
    import BehaviourEditor from "./BehaviourEditor.svelte";
    import BCustom from "./behaviours/BCustom.svelte";

    export let behaviour: Behaviour;
    export let sprite: Sprite;

    // TODO could do this cleaner
    $: uuid = behaviour instanceof BehaviourLink? 
        behaviour.uuid 
    : 
        `${sprite.uuid}/${behaviour.uuid}`
    ;

    let bStore = behaviour instanceof BehaviourLink?
        $resourceManager.getResourceStore(behaviour.linkedBehaviourUUID)
    :
        $resourceManager.getResourceStore(behaviour)
    ;

    const dispatch = createEventDispatcher();

    function moveUp() {
        dispatch("move", -1);
    }
    function moveDown() {
        dispatch("move", 1);
    }
    function remove() {
        dispatch("remove");
    }
    async function transformToCode() {
        let result = await asyncYesNoPopup("Do you want to convert this component to a code block? This is not reversible at the moment.")
        if(result) behaviour.svelteComponent = BCustom;
        cards.remove(uuid);
        openCard(BehaviourEditor, true, uuid);
    }

</script>

<p class="behaviour-title">
    <AtlasIcon id={behaviour.iconID} />
    <span class="spacer" />
    <span class="name">{$bStore.name}</span>
    <button on:click={() => moveUp()} class="borderless"><AtlasIcon id={6} /></button>
    <button on:click={() => moveDown()} class="borderless"><AtlasIcon id={7} /></button>
    <button on:click={() => remove()} class="borderless"><AtlasIcon id={32} /></button>
</p>
<!-- <svelte:component this={behaviour.svelteComponent} {behaviour}></svelte:component> -->

<p class="bottom-bar">
    <button on:click={() => { openCard(BehaviourEditor, true, uuid) }}>open</button>
    {#if behaviour.svelteComponent != BCustom}
        <button on:click={() => { transformToCode() }}>convert to code</button>
    {/if}
</p>

<style>

    p.behaviour-title {
        display: flex;
    }

    p.behaviour-title > .name {
        flex-grow: 1;
    }

    p.bottom-bar {
        display: flex;
        justify-content: space-between;
    }

</style>