<script context="module" lang="ts">
    export function openEditorWindow(resource: Resource) {
        // TODO not clean ?
        if(resource instanceof Sprite) {
            openCard(SpriteEditor, resource.uuid);
        } else if (resource instanceof Room) {
            openCard(RoomEditor, resource.uuid);
        } else if (resource instanceof Behaviour) {
            openCard(BehaviourEditor, resource.uuid);
        } else if (resource instanceof SoundEffect) {
            openCard(SoundEffectEditor, resource.uuid);
        } else {
            console.log(`no window implemented for ${resource.type}`);
        }
    }
</script>

<script lang="ts">
import { cards, openCard } from "../modules/cardManager";
import { resourceManager } from "../modules/game/ResourceManager";
import Behaviour from "../modules/structs/behaviour";
import type Resource from "../modules/structs/resource";
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


    export let selfResource: Room | Sprite | Behaviour | SoundEffect;

    let hover: boolean = false;

    function openMe() {
        openEditorWindow(selfResource);
    }

    async function deleteMe() {
        let confirmed = await asyncYesNoPopup(`Delete ${selfResource.name}?`);

        if(confirmed) {   
            $resourceManager.deleteResource(selfResource.uuid);
            cards.remove(selfResource.uuid);
            $resourceManager.refresh();   
        }
    }

    async function renameMe() {
        let name = await asyncGetTextPopup(`Choose new name:`, selfResource.name);
        if(name) {
            selfResource.name = name;
            $resourceManager.refresh();
        }
    }

    function ondragover(evt: DragEvent) {
        evt.preventDefault();
    }  
    function ondragenter(evt: DragEvent)  {
        hover = true;
    }
    function ondragleave(evt: DragEvent)  {
        hover = false;
    }
    function ondragstart(evt: DragEvent)  {
        evt.dataTransfer?.setData('text/uuid', selfResource.uuid);
        // console.log("src: " + uuid)
    }

    function ondrop(evt: DragEvent)  { 
        evt.preventDefault() 
        hover = false;

        let otherUUID = evt.dataTransfer?.getData("text/uuid");
        if(otherUUID) {
            // console.log(otherUUID);
            const _resourceManager = $resourceManager;
            let other = _resourceManager.getResource(otherUUID);

            if(!other) {
                console.log(`could not find ${otherUUID}`); // shouldn't happen
            } else if(other == selfResource) {
                console.log(`can't move something into itself`)
            } if(other.type != selfResource.type) {
                console.log(`can only swap with resources of same type`)
            } else {
                // selfResource._parent?.insert(other, selfResource);
                _resourceManager.moveResource(otherUUID, selfResource.uuid);
                _resourceManager.refresh();
            }
        }
    }
</script>


<div draggable="true" class={`resource-link  resource-${selfResource.type}`}
    on:dragover={ondragover}
    on:dragenter={ondragenter}
    on:dragleave={ondragleave}
    on:dragstart={ondragstart}
    on:drop={ondrop}
>
    <span class="grabbable container" class:drag-hover={hover}
    >
        <span class=icon>
            {#if selfResource instanceof Sprite}
                <SpriteIcon spriteID={selfResource.uuid}></SpriteIcon>
            {:else}
                {selfResource.getIconElement()}
            {/if}
        </span>
        <button class="name borderless" on:click={ () => openMe() } title="open">
            {selfResource.name}
        </button>
        <button class="borderless" on:click={ () => renameMe() } title="rename">
            <AtlasIcon id={33} />
        </button>
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
</style>