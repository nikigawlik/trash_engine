<script context="module" lang="ts">
    import { get } from "svelte/store";

    export async function newResource(resourceConstructor: typeof Resource, resourceName: string) {
        let name = await asyncGetTextPopup(`Name of the ${resourceName}:`, `unnamed ${resourceName}`);
        if(name) {    
            let newResource = new resourceConstructor(name);
            get(gameData).addResource(newResource);
            openEditorWindow(newResource);
            return true
        }
        return false
    }
</script>

<script lang="ts">
    import { gameData } from "../modules/game/game_data";
    import Behaviour from "../modules/structs/behaviour";
    import type Resource from "../modules/structs/resource";
    import Room from "../modules/structs/room";
    import SoundEffect from "../modules/structs/soundEffect";
    import Sprite from "../modules/structs/sprite";
    import { asyncGetTextPopup } from "../modules/ui";
    import AtlasIcon from "./AtlasIcon.svelte";
    import { openEditorWindow } from "./ResourceTreeResource.svelte";

    export let resourceConstructor: typeof Resource;
    export let displayName: string;

    let contentsHidden = false;

    // TODO not like this
    let resourceName = 
        (resourceConstructor == Sprite)?  "sprite": 
        (resourceConstructor == Room)?  "room":
        (resourceConstructor == Behaviour)?  "script":
        (resourceConstructor == SoundEffect)?  "sound effect":
        "null" 
    ;
    
    // function onclick(evt: MouseEvent)  {
    //     openContextMenu(evt, selfResource);
    // }
</script>



<div class="resource-link">
    <button class="fold borderless" on:click={ () => contentsHidden = !contentsHidden }>
        <AtlasIcon id={contentsHidden? 4 : 7} />
    </button>
    <span class=icon>
        📁
    </span>
    <span class=name>{displayName}</span>
    <button class="new" on:click={ () => newResource(resourceConstructor, resourceName) }>
        <AtlasIcon id={22} />
        {resourceName}
    </button>

</div>
{#if !contentsHidden}
<slot />
{/if}

<style>
    
    * {
        white-space: nowrap;
    }

    .resource-link {
        width: 100%;
        display: flex;
        align-items: center;
        align-content: stretch;
    }

    button.new {
        padding-left: 0;
    }

    .icon {
        /* height: fit-content; */
        /* height: 1.5em;
        width: 1.5em; */
        display: inline-block;
        margin-right: 4px;
        padding: auto;
        text-align: end;
    }

    .name {
        flex-grow: 1;
    }
</style>