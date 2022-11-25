<script lang="ts">
import type { CardInstance } from "../modules/cardManager";
import type Behaviour from "../modules/game/behaviour";
import { resourceManager } from "../modules/game/ResourceManager";
import type Sprite from "../modules/structs/sprite";
import { blockingPopup } from "../modules/ui";
import AtlasIcon from "./AtlasIcon.svelte";
import Card from "./Card.svelte";
import ImageEditor from "./ImageEditor.svelte";
import SelectBehaviourPopUp from "./SelectBehaviourPopUp.svelte";

    export let card: CardInstance;

    console.log(`open sprite ${card.uuid}`);
    let sprite: Sprite = $resourceManager?.findByUUID(card.uuid) as Sprite;

    $: {card.name = sprite.name; $resourceManager;} // $resourceManager added for reactivity
    $: card.className = "sprite-editor"
    $: card.position.width = 350;

    let mode: "draw" | "script" = "draw";

    $: behaviours = sprite.behaviours;

    function removeBehaviour(behaviour: Behaviour) {
        sprite.behaviours = sprite.behaviours.filter(x => x != behaviour);
        behaviours = sprite.behaviours; // trigger reactivity
    }

    function reinsertBehaviour(behaviour: Behaviour, position: number) {
        let curIndex = sprite.behaviours.indexOf(behaviour);
        if(curIndex < 0) return;
        position = Math.min(Math.max(position, 0), behaviours.length);
        
        sprite.behaviours.splice(curIndex, 1);
        sprite.behaviours.splice(position, 0, behaviour);

        behaviours = sprite.behaviours;
    }

    /*
    01 234
    AB.DE
    C
    1, 2
    1, 3
    c = 2
    
    */

    async function addBehaviour() {
        let result = await new Promise<any>(resolve =>
        blockingPopup.set({
            componentType: SelectBehaviourPopUp as any,
            data: {},
            resolve,
        }));
        if(result) {
            sprite.behaviours.push(result);
            sprite = sprite;
        }
    }
</script>

<Card autoFocus={true} contentMinWidth={240} {card}>
    <div class="modes">
        <button on:click={() => mode = "draw" } class:selected={mode == "draw"}>draw</button>
        <button on:click={() => mode = "script" } class:selected={mode == "script"}>script</button>
    </div>
    {#if mode=="draw"}
        <ImageEditor spriteID={sprite.uuid}/>
    {:else if mode == "script"}
        <ul class="behaviours">
            {#each behaviours as behaviour, i (behaviour.uuid)}
                <li>
                    <p class="behaviour-title">
                        <AtlasIcon id={behaviour.iconID} />
                        <span class="spacer" />
                        <span class="name">{behaviour.name}</span>
                        <button on:click={() => reinsertBehaviour(behaviour, i-1)} class="borderless"><AtlasIcon id={6} /></button>
                        <button on:click={() => reinsertBehaviour(behaviour, i+1)} class="borderless"><AtlasIcon id={7} /></button>
                        <button on:click={() => removeBehaviour(behaviour)} class="borderless"><AtlasIcon id={32} /></button>
                    </p>
                    <svelte:component this={behaviour.svelteComponent} {behaviour}></svelte:component>
                </li>
            {/each}
            <li>
                <button on:click={addBehaviour}>
                <AtlasIcon id={22} height={16} />
                add behaviour
                </button>
            </li>
        </ul>
    {/if}
</Card>

<style>
    .modes {
        margin-bottom: 8px;
        border-bottom: 1px solid var(--main-color);
    }

    .modes button {
        box-shadow: none;
        border-bottom: none;
        padding-bottom: 4px;
    }

    .modes button.selected {
        border-bottom: none;
        box-shadow: 0px 2px var(--bg-color);
    }

    ul.behaviours {
        display: flex;
        flex-direction: column;
        align-items: stretch;

        overflow-y: auto;
    }
    
    ul.behaviours>li {
        margin: .8rem 0;
        margin-right: .2rem;
        padding: .8rem;
        border: 1px solid var(--main-color);
    }

    ul.behaviours>li:last-child {
        border: none;
        margin: 0;
        margin-bottom: .5rem;
        padding: 0;
    }

    p.behaviour-title {
        display: flex;
    }

    p.behaviour-title > .name {
        flex-grow: 1;
    }
    
    /* textarea {
        flex-grow: 1;
        overflow-wrap: normal;
    } */

    /* TODO make non-global, but will have to restructure canvas stuff  */
    :global(.card.sprite-editor .canvas-container canvas) {
        display: block;
        margin: auto;
        border: 1px solid var(--main-color);
        background-color: var(--stripey-gradient);
        
        /* overflow: hidden; */
        /* flex-grow: 1; */
        /* object-fit:none ; */
        background: var(--stripey-gradient);
    }
</style>