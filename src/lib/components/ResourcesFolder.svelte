<script lang="ts">
    import { resourceManager } from "../modules/game/ResourceManager";
    import type Resource from "../modules/structs/resource";
    import Room from "../modules/structs/room";
    import Sprite from "../modules/structs/sprite";
    import { asyncGetTextPopup } from "../modules/ui";
    import ContextMenu, { ContextMenuData } from "./ContextMenu.svelte";
    import { openEditorWindow } from "./ResourceTreeResource.svelte";

    export let resourceConstructor: typeof Resource;
    export let displayName: string;

    // TODO not like this
    let resourceName = resourceConstructor == Sprite?  "sprite": 
        resourceConstructor == Room?  "room":
        "null" 
    ;

    let currentContextMenu: ContextMenuData = null;

    function openContextMenu(clickEvent: MouseEvent) {
        let options =[
            {
                id: "new_resource",
                text: `new ${resourceName}`, 
                callback: async () => {
                    let name = await asyncGetTextPopup(`Name of the ${resourceName}:`, `unnamed ${resourceName}`);
                    if(name) {    
                        let newResource = new resourceConstructor(name, $resourceManager);
                        $resourceManager.addResource(newResource);
                        openEditorWindow(newResource);
                    }
                }
            },
        ];

        currentContextMenu = {
            title: "",
            options: options,
            x: clickEvent.offsetX,
            y: clickEvent.offsetY,
        };
    }
    
    // function onclick(evt: MouseEvent)  {
    //     openContextMenu(evt, selfResource);
    // }
</script>



<div class="resource-link">
    <ContextMenu bind:data={currentContextMenu}>
        <button on:click={openContextMenu}>
            <span class=icon>
                📁
            </span>
            <span class=name>{displayName}</span>
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