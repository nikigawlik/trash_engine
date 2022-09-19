<script lang="ts">
import { browser } from '$app/env';
import GamePreview from '../components/GamePreview.svelte';
import Resources from "../components/Resources.svelte";
import { openCard } from '../modules/cardManager';
import { resourceManager } from "../modules/game/ResourceManager";
import { data } from "../modules/globalData";
import Log from "./../components/Log.svelte";
import Main from "./../components/Main.svelte";
import ScriptEditor from "./../components/ScriptEditor.svelte";
import Settings from "./../components/Settings.svelte";
import * as sprite_editor from "./../components/SpriteEditor.svelte";
import * as database from "./../modules/database";
import * as globalData from "./../modules/globalData";
import Folder from "./../modules/structs/folder";
import Instance from "./../modules/structs/instance";
import Room from "./../modules/structs/room";
import Sprite from "./../modules/structs/sprite";
import * as ui from "./../modules/ui";
import { asyncYesNoPopup } from './../modules/ui';
import { base } from '$app/paths'
 

    let main: Main | null;

    $: if(browser) $data.editor.settings.darkMode? document.body.classList.add("dark") : document.body.classList.remove("dark");


    let init = async () => {
        if(!browser) return;
        console.log("--- window.onload ---")
        // initialize different modules
        await database.init([Sprite, Room, Folder, Instance]);
        // await ResourceManager.init();
        {
            console.log("load app...");
            await globalData.load();
            await resourceManager.get().load();
        }
        await ui.init();
        await sprite_editor.init();
        // await SaveSystem.init();
        console.log("--- --- ---- --- ---")
        console.log("--- loading done ---")
        console.log("--- --- ---- --- ---")
    };

    let initPromise = init();
    let savingPromise = new Promise<any>(resolve => resolve(null)); // default resolved promise

    $: combinedPromise = Promise.all([initPromise, savingPromise]);


    function save() {
        // TODO STUB
        let p1 = resourceManager.get().save();
        let p2 = data.save();
        savingPromise = Promise.all([p1, p2]);
    }

    function keyPress(event: KeyboardEvent) {
        if(event.ctrlKey && event.key == "s") {
            event.preventDefault();
            save();
        }
    }

    if(browser) document.onkeydown = keyPress;

</script>

<svelte:head>
    <title>trash engine</title>
    <link rel="stylesheet" href="{base}/reset.css">
    <link rel="stylesheet" href="{base}/main.css"> 
</svelte:head>

{#await initPromise}
    <div class=loading>
        <img src="{base}/icon.png" alt="trashcan">
        loading...
    </div>
{:then} 
{#await savingPromise}
    <div class=saving>
        <img src="{base}/icon.png" alt="trashcan">
        saving...
    </div>
{:then} 
    <header>
        <div><img src="{base}/icon.png" alt="trashcan icon" /><h2>trash engine</h2></div>
        <ul class="topbar">
            <!-- <li><button onclick="cloneFromTemplate('#objectEditorCard')">new object</button></li> -->
            <li><button on:click={() => openCard(ScriptEditor)}>new script</button></li>
            <li><button on:click={() => openCard(Log)}>new log</button></li>
            <li><button on:click={() => openCard(Settings)}>settings</button></li>
            <li><button on:click={() => openCard(Resources, false)}>resources</button></li>
            <li><button on:click={() => openCard(GamePreview, false)}>game</button></li>
            <li><button on:click={() => save()}>save</button></li>
            <li><button on:click={() => location.reload()}>load</button></li>
            <li><button on:click={async() => (await asyncYesNoPopup("REALLY?")) && database.deleteDatabase()}>DELETE DATA</button></li>
        </ul>
    </header>
    <Main bind:this={main}></Main>

{/await}
{/await}
