<svelte:head>
    <title>ngine</title>
    <link rel="stylesheet" href="reset.css">
    <link rel="stylesheet" href="main.css"> 
</svelte:head>

<script lang="ts">
import { asyncYesNoPopup } from './../modules/ui';
import { browser } from '$app/env';
import { onMount } from "svelte";
import Resources from "../components/Resources.svelte";
import { data } from "../modules/globalData";
import ResourceManager from "../modules/ResourceManager";
import Log from "./../components/Log.svelte";
import Main from "./../components/Main.svelte";
import ScriptEditor from "./../components/ScriptEditor.svelte";
import Settings from "./../components/Settings.svelte";
import * as database from "./../modules/database";
import * as globalData from "./../modules/globalData";
import Folder from "./../modules/structs/folder";
import Instance from "./../modules/structs/instance";
import Room from "./../modules/structs/room";
import Sprite from "./../modules/structs/sprite";
import * as sprite_editor from "./../components/SpriteEditor.svelte";
import * as ui from "./../modules/ui";
import { openCard } from '../modules/cardManager';
 

    let main: Main | null;

    $: if(browser) $data.editor.settings.darkMode? document.body.classList.add("dark") : document.body.classList.remove("dark");

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
        }
        await ui.init();
        await sprite_editor.init();
        // await SaveSystem.init();
        console.log("--- --- ---- --- ---")
        console.log("--- loading done ---")
        console.log("--- --- ---- --- ---")
    })
</script>

<header>
    <div><img src="icon.png" alt="trashcan icon" /><h2>trash engine</h2></div>
    <ul class="topbar">
        <!-- <li><button onclick="cloneFromTemplate('#objectEditorCard')">new object</button></li> -->
        <li><button on:click={() => openCard(ScriptEditor)}>new script</button></li>
        <li><button on:click={() => openCard(Log)}>new log</button></li>
        <li><button on:click={() => openCard(Settings)}>settings</button></li>
        <li><button on:click={() => openCard(Resources, false)}>resources</button></li>
        <li><button on:click={() => save()}>save</button></li>
        <li><button on:click={() => location.reload()}>load</button></li>
        <li><button on:click={async() => (await asyncYesNoPopup("REALLY?")) && database.deleteDatabase()}>DELETE DATA</button></li>
    </ul>
</header>
<Main bind:this={main}></Main>
