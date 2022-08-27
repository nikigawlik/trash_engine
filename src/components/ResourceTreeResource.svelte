<script lang="ts">
import type Resource from "src/modules/structs/resource";
import { asyncGetTextPopup,asyncYesNoPopup } from "../modules/components";
import ContextMenu from "./ContextMenu.svelte";
import type { ContextMenuData } from "./ContextMenu.svelte";
// import { currentContextMenu } from "./ContextMenu.svelte";
    export let selfResource: Resource;

    let hover: boolean = false;

    let currentContextMenu: ContextMenuData|null = null;

    function openContextMenu(clickEvent: MouseEvent, resource: Resource) {
        let options = getContextMenuOptions(resource);
        console.log(`${clickEvent.clientX} ${clickEvent.clientY}`)

        currentContextMenu = {
            title: "",
            options: options,
            x: clickEvent.offsetX,
            y: clickEvent.offsetY,
        };
        
        // TODO callbacks
    }
    
    function getContextMenuOptions(resource: Resource) {
        return [
            {
                id: "open",
                text: "open",
                callback: async () => resource.openEditorWindow()
            },
            {
                id: "delete",
                text: `delete`,
                callback: async () => {
                    let confirmed = await asyncYesNoPopup(`Delete <em>${resource.name}</em>?`); // TODO
        
                    if(confirmed) {   
                        resource.removeSelf();
                        let resourceWindow = document.querySelector(`main .card[data-resource-uuid="${resource.uuid}"]`);
                        if(resourceWindow) resourceWindow.remove();
                        resource._resourceManager.refresh();   
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
                        resource._resourceManager.refresh();
                        // TODO
                        // update name on card
                        // let resourceWindow = document.querySelector(`main .card[data-resource-uuid="${this.uuid}"]`);
                        // resourceWindow.querySelector("h3 .name").innerText = name; // not super elegant, but ok
                    }
                }
            }
        ];
    }
    
    function onclick(evt: MouseEvent)  {
        console.log("click")
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
            let topFolder = selfResource.getTopFolder();
            const _resourceManager = selfResource._resourceManager;
            if(topFolder) {
                let other = _resourceManager.findByUUIDInFolder(otherUUID, topFolder.name);
                if(!other) {
                    console.log(`could not find ${otherUUID} / ${topFolder.name}`)
                } else if(other.isParentOf(selfResource)) {
                    console.log(`can't move parent into child folder`)
                } else if(other == selfResource) {
                    console.log(`can'resource.t move something into itself`)
                } else if(selfResource.type == "folder") {
                    selfResource.add(other);
                    // _resourceManager.refresh();
                } else {
                    selfResource._parent?.insert(other, selfResource);
                    // _resourceManager.refresh();
                }
            } else {
                console.log(`can't move into top folders / detached tree`)
            }
        }
    }
</script>


<button draggable="true" class="grabbable" class:drag-hover={hover}
on:click={onclick}
on:dragover={ondragover}
on:dragenter={ondragenter}
on:dragleave={ondragleave}
on:dragstart={ondragstart}
on:drop={ondrop}
>
    {#if currentContextMenu}
    <ContextMenu bind:data={currentContextMenu}></ContextMenu>
    {/if}
    <span class={`resource-link  resource-${selfResource.type}`}>
        <span class="icon">{selfResource.getIconElement()}</span>
        {selfResource.name} 
    </span>
</button>