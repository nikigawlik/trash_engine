<script lang="ts">
import type { Writable } from "svelte/store";
import { CardInstance, openCard } from "../modules/cardManager";
import { resourceManager } from "../modules/game/ResourceManager";
import Behaviour from "../modules/structs/behaviour";
import BehaviourLink from "../modules/structs/behaviourLink";
import type Sprite from "../modules/structs/sprite";
import { blockingPopup } from "../modules/ui";
import AtlasIcon from "./AtlasIcon.svelte";
import BehaviourPreview from "./BehaviourPreview.svelte";
import Card from "./Card.svelte";
import ImageEditor from "./ImageEditor.svelte";
import SelectBehaviourPopUp from "./SelectBehaviourPopUp.svelte";
    import BehaviourEditor from "./BehaviourEditor.svelte";

    export let card: CardInstance;

    console.log(`open sprite ${card.uuid}`);
    let sSprite = resourceManager.get().getResourceStore(card.uuid) as Writable<Sprite>;

    $: { card.name = $sSprite?.name; card = card; }
    card.className = "sprite-editor"
    card.position.width = 350;

    let mode: "draw" | "script" = "draw";

    $: behaviours = $sSprite.resolveBehaviours();


    function removeBehaviour(behaviour: Behaviour) {
        $sSprite.removeBehaviour(behaviour);
        $sSprite = $sSprite; // trigger reactivity
    }

    function reinsertBehaviour(behaviour: Behaviour, position: number) {
        let curIndex = $sSprite.behaviours.indexOf(behaviour);
        if(curIndex < 0) return;
        position = Math.min(Math.max(position, 0), behaviours.length);
        
        $sSprite.behaviours.splice(curIndex, 1);
        $sSprite.behaviours.splice(position, 0, behaviour);

        $sSprite = $sSprite;
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
        if(result instanceof Behaviour || result instanceof BehaviourLink) {
            // TODO code duplication, I can't do this everywhere
            let b = result;
            let uuid = b instanceof BehaviourLink? 
                b.uuid 
            : 
                `${$sSprite.uuid}/${b.uuid}`
            ;
            
            if(!(b instanceof BehaviourLink))
                openCard(BehaviourEditor, uuid);
            
            $sSprite.addBehaviour(result);
            $sSprite = $sSprite;
        }
    }
</script>

<Card autoFocus={true} contentMinWidth={240} {card}>
    <div class="modes">
        <button on:click={() => mode = "draw" } class:selected={mode == "draw"}>draw</button>
        <button on:click={() => mode = "script" } class:selected={mode == "script"}>script</button>
    </div>
    {#if mode=="draw"}
        <ImageEditor spriteID={$sSprite.uuid}/>
    {:else if mode == "script"}
        <ul class="behaviours">
            {#each behaviours as behaviour, i (behaviour.uuid)}
                <li>
                    <BehaviourPreview 
                        sprite={$sSprite}
                        {behaviour}
                        on:move={(evt) => reinsertBehaviour(behaviour, i+evt.detail)}
                        on:remove={() => removeBehaviour(behaviour)}
                    />
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