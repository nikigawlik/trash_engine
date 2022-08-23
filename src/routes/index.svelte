<svelte:head>
    <title>ngine</title>
    <link rel="stylesheet" href="reset.css">
    <link rel="stylesheet" href="main.css"> 
</svelte:head>

<script lang="ts">
import Main from "./../components/Main.svelte";
import { onMount } from "svelte";
import * as database from "./../modules/database";
import Sprite from "./../modules/structs/sprite";
import Room from "./../modules/structs/room";
import Folder from "./../modules/structs/folder";
import Instance from "./../modules/structs/instance";
import * as globalData from "./../modules/globalData";
import ResourceManager from "./../modules/ResourceManager";
import * as ui from "./../modules/ui";
import * as sprite_editor from "./../modules/structs/sprite"; 
import { asyncYesNoPopup } from "./../modules/components";
import ScriptEditor from "./../components/ScriptEditor.svelte";
import Log from "./../components/Log.svelte";
import Settings from "./../components/Settings.svelte";

    let main: Main | null;

    function openResourceManager() {
        // TODO STUB
    }

    function save() {
        // TODO STUB
    }

    onMount(async () => {
        console.log("--- window.onload ---")
        // initialize different modules
        await database.init([Sprite, Room, Folder, Instance]);
        // await ResourceManager.init();
        {
            console.log("load app...");
            await globalData.load();

            // let resWindow = html`<${ResourceWindow} resourceManager=${resourceManager}><//>`;
            await ResourceManager.init();
            openResourceManager(); 
        }
        await ui.init();
        await sprite_editor.init();
        // await SaveSystem.init();
        console.log("--- --- ---- --- ---")
        console.log("--- loading done ---")
        console.log("--- --- ---- --- ---")
    })
</script>

<body>    
    <header>
        <div><img src="icon.png" alt="trashcan icon" /><h2>trash engine</h2></div>
        <ul class="topbar">
            <!-- <li><button onclick="cloneFromTemplate('#objectEditorCard')">new object</button></li> -->
            <li><button on:click={() => main?.openCard(ScriptEditor)}>new script</button></li>
            <li><button on:click={() => main?.openCard(Log)}>new log</button></li>
            <li><button on:click={() => main?.openCard(Settings)}>settings</button></li>
            <li><button on:click={() => openResourceManager()}>resources</button></li>
            <li><button on:click={() => save()}>save</button></li>
            <li><button on:click={() => location.reload()}>load</button></li>
            <li><button on:click={async() => (await asyncYesNoPopup("REALLY?")) && database.deleteDatabase()}>DELETE DATA</button></li>
        </ul>
    </header>
    <Main bind:this={main}></Main>
</body>