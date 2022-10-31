<script lang="ts">
import { openCard } from "../modules/cardManager";
import { data } from "../modules/globalData";
import Folder from "../modules/structs/folder";
import type Resource from "../modules/structs/resource";
import Room from "../modules/structs/room";
    import { nameConstructorMap } from "../modules/structs/savenames";
import Sprite from "../modules/structs/sprite";
import { asyncGetTextPopup, asyncYesNoPopup } from "../modules/ui";
import type { ContextMenuData } from "./ContextMenu.svelte";
import ContextMenu from "./ContextMenu.svelte";
import RoomEditor from "./RoomEditor.svelte";
import SpriteEditor from "./SpriteEditor.svelte";
import SpriteIcon from "./SpriteIcon.svelte";
// import { currentContextMenu } from "./ContextMenu.svelte";
    export let selfResource: Resource;

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

    function openEditorWindow(resource: Resource) {
        // TODO not clean ?
        if(resource instanceof Sprite) {
            openCard(SpriteEditor, true, resource.uuid);
        } else if (resource instanceof Room) {
            openCard(RoomEditor, true, resource.uuid);
        } else {
            console.log(`no window implemented for ${resource.type}`);
        }
    }
    
    function getContextMenuOptions(resource: Resource) {
        let defaultOptions = [
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
                    }
                }
            }
        ];

        let options;

        if(resource instanceof Folder) {
            const resourceConstructor = resource.getTopFolder()?.resourceType;
            // const resourceName = resourceConstructor?.name.toLowerCase();
            const resourceName = 
                resourceConstructor == Sprite?  "sprite": 
                resourceConstructor == Room?  "room":
                "null" 
            ;
            options = resourceConstructor? [
                {
                    id: "new_resource",
                    text: `new ${resourceName}`, 
                    callback: async () => {
                        let name = await asyncGetTextPopup(`Name of the ${resourceName}:`, `unnamed ${resourceName}`);
                        if(name) {    
                            let newResource = new resourceConstructor(name, resource._resourceManager);
                            resource.add(newResource);
                            resource._resourceManager?.refresh();
                        }
                    }
                },
            ] : [];
            if(data.get().editor.settings.subFolders) {
                options.push({
                    id: "new_folder",
                    text: "new folder", 
                    callback: async () => {
                        let name = await asyncGetTextPopup(`Name of the folder:`, `unnamed folder`);
                        if(name) {
                            let newFolder = new Folder(undefined, resource._resourceManager);
                            newFolder.name = name;
                            resource.add(newFolder);
                            resource._resourceManager?.refresh();
                        }
                    }
                });
            }
            if (!resource.isTopFolder()) {
                options.push(
                    defaultOptions.find(x => x.id == "rename")!, // TODO bad use of "!"" ?
                    defaultOptions.find(x => x.id == "delete")!,
                );
            }
        } else {
            options = defaultOptions;
        }
        
        
        
        return options;
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
            let topFolder = selfResource.getTopFolder();
            const _resourceManager = selfResource._resourceManager;
            if(topFolder) {
                let other = _resourceManager.findByUUIDInFolder(otherUUID, topFolder.name);
                if(!other) {
                    console.log(`could not find ${otherUUID} / ${topFolder.name}`)
                } else if(other.isParentOf(selfResource)) {
                    console.log(`can't move parent into child folder`)
                } else if(other == selfResource) {
                    console.log(`can't move something into itself`)
                } else if(selfResource.type == "folder") {
                    selfResource.add(other);
                    _resourceManager.refresh();
                } else {
                    selfResource._parent?.insert(other, selfResource);
                    _resourceManager.refresh();
                }
            } else {
                console.log(`can't move into top folders / detached tree`)
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
                    <SpriteIcon sprite={selfResource}></SpriteIcon>
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