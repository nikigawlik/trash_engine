<script context="module" lang="ts">
    export function openEditorWindow(resource: Resource) {
        // TODO not clean ?
        if(resource instanceof Sprite) {
            openCard(SpriteEditor, true, resource.uuid);
        } else if (resource instanceof Room) {
            openCard(RoomEditor, true, resource.uuid);
        } else if (resource instanceof Behaviour) {
            openCard(BehaviourEditor, true, resource.uuid);
        } else {
            console.log(`no window implemented for ${resource.type}`);
        }
    }
</script>

<script lang="ts">
import { openCard } from "../modules/cardManager";
import Behaviour from "../modules/structs/behaviour";
import { resourceManager } from "../modules/game/ResourceManager";
import type Resource from "../modules/structs/resource";
import Room from "../modules/structs/room";
import Sprite from "../modules/structs/sprite";
import { asyncGetTextPopup, asyncYesNoPopup } from "../modules/ui";
import BehaviourEditor from "./BehaviourEditor.svelte";
import type { ContextMenuData } from "./ContextMenu.svelte";
import ContextMenu from "./ContextMenu.svelte";
import RoomEditor from "./RoomEditor.svelte";
import SpriteEditor from "./SpriteEditor.svelte";
import SpriteIcon from "./SpriteIcon.svelte";
// import { currentContextMenu } from "./ContextMenu.svelte";
    export let selfResource: Room | Sprite | Behaviour;

    let hover: boolean = false;
    let currentContextMenu: ContextMenuData|null = null;

    function openContextMenu(clickEvent: MouseEvent, resource: Resource) {
        let options = getContextMenuOptions(resource);

        currentContextMenu = {
            title: "",
            options: options,
            x: clickEvent.offsetX,
            y: clickEvent.offsetY,
        };
    }
    
    function getContextMenuOptions(resource: Resource) {
        return [
            {
                id: "open",
                text: "open",
                callback: async () => openEditorWindow(resource)
            },
            {
                id: "delete",
                text: `delete`,
                callback: async () => {
                    let confirmed = await asyncYesNoPopup(`Delete ${resource.name}?`);
        
                    if(confirmed) {   
                        $resourceManager.deleteResource(resource.uuid);
                        let resourceWindow = document.querySelector(`main .card[data-resource-uuid="${resource.uuid}"]`);
                        if(resourceWindow) resourceWindow.remove();
                        $resourceManager.refresh();   
                    }
                }
            },
            {
                id: "rename",
                text: `rename`,
                callback: async () => {
                    let name = await asyncGetTextPopup(`Choose new name:`, resource.name);
                    if(name) {
                        resource.name = name;
                        $resourceManager.refresh();
                    }
                }
            }
        ];
    }
    
    function onclick(evt: MouseEvent)  {
        openContextMenu(evt, selfResource);
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
    <ContextMenu bind:data={currentContextMenu}>
        <!-- 
draggable="true" 
         -->
        <button class="grabbable" class:drag-hover={hover}
        on:click={onclick}
        >
            <span class=icon>
                {#if selfResource instanceof Sprite}
                    <SpriteIcon spriteID={selfResource.uuid}></SpriteIcon>
                {:else}
                    {selfResource.getIconElement()}
                {/if}
            </span>
            <span class=name>{selfResource.name}</span> 
        </button>
    </ContextMenu>
    <!-- {#if currentContextMenu}
    {/if} -->
</div>

<style>
    * {
        white-space: nowrap;
    }

    button {    
        /* do not style like other buttons */
        border: none;
        box-shadow: none;
        text-align: left;
        
        /* alignment stuff */
        display: table-cell;
        width: 100%;
        vertical-align: middle;
        /* padding-top: auto; */
        /* padding-bottom: auto; */
    }

    button > span {
        vertical-align: middle;
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