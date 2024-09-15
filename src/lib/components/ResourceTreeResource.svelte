<script context="module" lang="ts">
    
    const resourceToEditorMap = [
        [Sprite, SpriteEditor],
        [Room, RoomEditor],
        [Behaviour, BehaviourEditor],
        [SoundEffect, SoundEffectEditor]
    ]
    
    export function openEditorWindow(resource: Resource) {
        for(let x of resourceToEditorMap) {
            let [resourceType, editorComponent] = x;

            if(resource instanceof resourceType) {
                openCard(editorComponent, resource.uuid);
                return;
            }
        }

        console.log(`no window implemented for ${resource.type}`);
    }
</script>

<script lang="ts">
import { cards, openCard } from "../modules/cardManager";
import { gameData } from "../modules/game/game_data";
import { asStore } from "../modules/store_owner";
import Behaviour from "../modules/structs/behaviour";
import Resource from "../modules/structs/resource";
import Room from "../modules/structs/room";
import SoundEffect from "../modules/structs/soundEffect";
import Sprite from "../modules/structs/sprite";
import { asyncGetTextPopup, asyncYesNoPopup } from "../modules/ui";
import AtlasIcon from "./AtlasIcon.svelte";
import BehaviourEditor from "./BehaviourEditor.svelte";
import RoomEditor from "./RoomEditor.svelte";
import SoundEffectEditor from "./SoundEffectEditor.svelte";
import SpriteEditor from "./SpriteEditor.svelte";
import SpriteIcon from "./SpriteIcon.svelte";


    export let resource: Room | Sprite | Behaviour | SoundEffect;
    let s_resource = asStore(resource);
    $: { resource = $s_resource }

    let hover: boolean = false;

    function openMe() {
        openEditorWindow(resource);
    }

    async function deleteMe() {
        let confirmed = await asyncYesNoPopup(`Delete ${resource.name}?`);

        if(confirmed) {   
            $gameData.deleteResource(resource.uuid);
            cards.remove(resource.uuid);   
        }
    }

    async function renameMe() {
        let name = await asyncGetTextPopup(`Choose new name:`, resource.name);
        if(name) {
            $s_resource.name = name
        }
    }

    // function ondragover(evt: DragEvent) {
    //     evt.preventDefault(); // makes this a valid drop target
    // }  

    // function ondragenter(evt: DragEvent)  {
    //     hover = true;
    // }
    // function ondragleave(evt: DragEvent)  {
    //     hover = false;
    // }

    function ondragstart(evt: DragEvent)  {
        evt.dataTransfer?.setData('text/uuid', resource.uuid);
    }

    // function ondrop(evt: DragEvent)  {
        
    //     evt.preventDefault() 
    //     hover = false;

    //     let otherUUID = evt.dataTransfer?.getData("text/uuid");
    //     console.log(`dropped: ${otherUUID} on ${$s_resource.uuid}`)
        
    //     // if(otherUUID) {
    //     //     // console.log(otherUUID);
    //     //     let other = $gameData.getResource(otherUUID);

    //     //     if(!other) {
    //     //         console.log(`could not find ${otherUUID}`); // shouldn't happen
    //     //     } else if(other == resource) {
    //     //         console.log(`can't move something into itself`)
    //     //     } if(other.type != resource.type) {
    //     //         console.log(`can only swap with resources of same type`)
    //     //     } else {
    //     //         // selfResource._parent?.insert(other, selfResource);
    //     //         $gameData.moveResource(otherUUID, resource.uuid); // not implemented, re-ordering currently not supported
    //     //     }
    //     // }
    // }
</script>


<!-- on:dragover={ondragover}
on:dragenter={ondragenter}
on:dragleave={ondragleave} -->
<div draggable="true" class={`resource-link  resource-${resource.type}`}
    on:dragstart={ondragstart}
>
    <span class="grabbable container" class:drag-hover={hover}
    >
        <span class=icon>
            {#if resource instanceof Sprite}
                <SpriteIcon spriteID={resource.uuid}></SpriteIcon>
            {:else}
                {resource.getIconElement()}
            {/if}
        </span>
        <button class="name borderless" on:click={ () => openMe() } title="open" draggable>
            {resource.name}
            <!-- this "filler" fixes glitchy button/draggable behaviour: -->
            <span class="filler">&nbsp;</span>
        </button>
        <!-- <button class="borderless" on:click={ () => renameMe() } title="rename">
            <AtlasIcon id={33} />
        </button> -->
        <button class="borderless" on:click={ () => deleteMe() } title="delete">
            <AtlasIcon id={51} />
        </button>
    </span>
</div>

<style>
    * {
        white-space: nowrap;
    }

    .container {
        width: 100%;
        display: flex;
        align-items: center;
        align-content: stretch;
    }

    .name {
        flex-grow: 1;
        flex-shrink: 1;
        min-width: 0;
        text-align: left;

        overflow: hidden; /* to hide the extra .filler */
    }

    .filler {
        /* min-width: 0;
        text-align: left; */
        display: inline-block;
        width:100%
    }

    .icon {
        /* height: fit-content; */
        height: 1.5em;
        width: 1.5em;
        display: inline-block;
        margin-right: 4px;
        padding: auto;
        text-align: end;
    }

    .resource-link {
        width: 100%;
    }

    .drag-hover {
        background-color: var(--off-main-color);
    }
</style>