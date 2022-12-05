<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { openCard } from "../modules/cardManager";
    import type Behaviour from "../modules/structs/behaviour";
    import { resourceManager } from "../modules/game/ResourceManager";
    import type Sprite from "../modules/structs/sprite";
    import AtlasIcon from "./AtlasIcon.svelte";
    import BehaviourEditor from "./BehaviourEditor.svelte";
    import BehaviourLink from "../modules/structs/behaviourLink";

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

<button on:click={() => { openCard(BehaviourEditor, true, uuid) }}>open</button>

<style>

    p.behaviour-title {
        display: flex;
    }

    p.behaviour-title > .name {
        flex-grow: 1;
    }
</style>