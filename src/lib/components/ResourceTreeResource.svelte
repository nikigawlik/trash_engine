<script context="module" lang="ts">
    import { SvelteComponent } from "svelte";

    
    const resourceToEditorMap = [
        [Sprite, SpriteEditor],
        [Room, RoomEditor],
        [Behaviour, BehaviourEditor],
        [SoundEffect, SoundEffectEditor]
    ] as [typeof Resource, typeof SvelteComponent][]
    
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

    let globalIsDragging = writable(false);
</script>

<script lang="ts">
import { writable } from "svelte/store";
import { cards, openCard } from "../modules/cardManager";
import { gameData } from "../modules/game/game_data";
import { data } from "../modules/globalData";
import { asStore } from "../modules/store_owner";
import Behaviour from "../modules/structs/behaviour";
import Resource from "../modules/structs/resource";
import Room from "../modules/structs/room";
import SoundEffect from "../modules/structs/soundEffect";
import Sprite from "../modules/structs/sprite";
import { asyncGetTextPopup, asyncYesNoPopup } from "../modules/ui";
import AtlasIcon from "./AtlasIcon.svelte";
import BehaviourEditor from "./Cards/BehaviourEditor.svelte";
import RoomEditor from "./Cards/RoomEditor.svelte";
import SoundEffectEditor from "./Cards/SoundEffectEditor.svelte";
import SpriteEditor from "./Cards/SpriteEditor.svelte";
import SpriteIcon from "./SpriteIcon.svelte";


    export let resource: Room | Sprite | Behaviour | SoundEffect;
    export let listPosition = -1;

    let s_resource = asStore(resource);
    $: { resource = $s_resource }


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

    // visually shows the drop target
    let hover: string = "" as "before"|"after"|"";

    function ondragover(evt: DragEvent) {
        evt.preventDefault(); // makes this a valid drop target
    }  

    function ondragenter(evt: DragEvent, pos: "before"|"after")  {
        hover = pos;
    }
    function ondragleave(evt: DragEvent, pos: "before"|"after")  {
        if(hover == pos) hover = "";
    }

    function ondragstart(evt: DragEvent)  {
        $globalIsDragging = true;
        console.log("fasdfa  " + $globalIsDragging )
        evt.dataTransfer?.setData('text/uuid', resource.uuid);
    }

    function ondragend(evt: DragEvent) {
        $globalIsDragging = false;
        console.log("fasdfa  " + $globalIsDragging )
    }



    function ondrop(evt: DragEvent, pos: "before"|"after")  {
        hover = "";
        let otherUUID = evt.dataTransfer?.getData("text/uuid");
        // console.log(`dropped: ${otherUUID} on ${$s_resource.uuid}`)
        // console.log(`dropped ${$gameData.getResource(otherUUID).name} ${pos} ${$s_resource.name}`)
        
        if(otherUUID) {
            // console.log(otherUUID);
            let other = $gameData.getResource(otherUUID);

            if(!other) {
                console.log(`could not find ${otherUUID}`); // shouldn't happen
            } else if(other == resource) {
                console.log(`can't move something into itself`)
            } if(other.type != resource.type) {
                console.log(`can only swap with resources of same type`)
            } else {
                // selfResource._parent?.insert(other, selfResource);
                $gameData.moveResource(otherUUID, resource.uuid, pos); // not implemented, re-ordering currently not supported
            }
        }
    }

    $: debugShowOrdinal = $data.editor.settings.showOrdinals;
</script>


<!-- svelte-ignore a11y-role-has-required-aria-props -->
<div 
    draggable="true" 
    class={`resource-link  resource-${resource.type}`}
    on:dragstart={ondragstart}
    on:dragend={ondragend}
    role="option"
    tabindex="0"
>
    {#if listPosition == 0}
    <!-- class:drag-hover={hover == "before"} -->
    <div 
        class="dropzone" 
        on:drop={evt => ondrop(evt, "before")} 
        on:dragover={ondragover}
        on:dragenter={evt => ondragenter(evt, "before")}
        on:dragleave={evt => ondragleave(evt, "before")}
        role="region"
        style:pointer-events={$globalIsDragging? "" : "none"}
        style:top="-50%"
        >
        <!-- --dropzone-- -->
        <div class="h-line"></div>
    </div>
    {/if}
    <div 
        class="grabbable container"
        class:border-top={hover == "before"}
        class:border-bottom={hover == "after"}
    >
        <span class=icon>
            {#if resource instanceof Sprite}
                <SpriteIcon spriteID={resource.uuid}></SpriteIcon>
            {:else}
                {resource.getIconElement()}
            {/if}
        </span>
        <button class="name borderless" on:click={ () => openMe() } title="open" draggable>
            {#if debugShowOrdinal}
                {resource.ordinal}
            {/if}
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
    </div>
    <!-- class:drag-hover={hover == "after"} -->
    <div 
        class="dropzone" 
        on:drop={evt => ondrop(evt, "after")} 
        on:dragover={ondragover}
        on:dragenter={evt => ondragenter(evt, "after")}
        on:dragleave={evt => ondragleave(evt, "after")}
        role="region"
        style:pointer-events={$globalIsDragging? "" : "none"}
        style:top="50%"
    >
        <!-- --dropzone-- -->
        <div class="h-line"></div>
    </div>
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

        position: relative;
    }

    .dropzone{
        height: var(--size-2);
        /* background-color: var(--off-bg-color); */
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        z-index: 10;
    }

    .border-top::before {
        content: "▶───────";
        position: absolute;
        transform: translate(-0.5em, -50%);
        /* border-top: var(--size-2) solid var(--off-bg-color); */
    }
    .border-bottom::after {
        content: "▶───────";
        position: absolute;
        transform: translate(-0.5em, 50%);
        /* border-bottom: var(--size-2) solid var(--off-bg-color); */
    }


/* 
    .dropzone.drag-hover>.h-line {
        background-color: var(--off-main-color);
    }
    .dropzone>.h-line {
        height: var(--size-2);
        transform: translateY(50%);
    } */
</style>