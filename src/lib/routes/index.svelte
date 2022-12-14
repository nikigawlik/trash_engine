<script lang="ts">
import "../../assets/main.css";
import "../../assets/reset.css";
import "../../assets/svg.css";
import AtlasIcon from "../components/AtlasIcon.svelte";
import GamePreview from "../components/GamePreview.svelte";
import Icon from "../components/Icon.svelte";
import LoadProjectPopUp from "../components/LoadProjectPopUp.svelte";
import Reference from "../components/Reference.svelte";
import Resources from "../components/Resources.svelte";
import SaveProjectPopUp from "../components/SaveProjectPopUp.svelte";
import { cards, openCard } from "../modules/cardManager";
import { resourceManager } from "../modules/game/ResourceManager";
import { data } from "../modules/globalData";
    import SoundEffect from "../modules/structs/soundEffect";
import { blockingPopup } from "../modules/ui";
import * as image_editor from "./../components/ImageEditor.svelte";
import Main from "./../components/Main.svelte";
import Settings from "./../components/Settings.svelte";
import * as database from "./../modules/database";
import * as globalData from "./../modules/globalData";
import { nameConstructorMap } from "./../modules/structs/savenames";
import * as ui from "./../modules/ui";

    let main: Main|null;

    $: {
        if($data.editor.settings.darkMode){
            document.body.classList.add("dark"); 
            document.body.classList.remove("light"); 
        } else {
            document.body.classList.add("light"); 
            document.body.classList.remove("dark");
        }
    }

    $: {
        window.onbeforeunload = $data.editor.settings.showWarningBeforeClosingApp?
          () => true : null;
    }

    let init = async () => {
        console.log("--- window.onload ---");
        
        // sfx (out of the timeline)
        (async () => {
            await new Promise( resolve => {
                window.addEventListener("mousedown", resolve);
                window.addEventListener("touchstart", resolve);
                window.addEventListener("keydown", resolve);
            });
            SoundEffect.init();
        })();


        // initialize different modules
        await database.init(nameConstructorMap);
        console.log("load app...");
        await globalData.load();
        await resourceManager.get().load();
        await image_editor.init();
        console.log("--- --- ---- --- ---")
        console.log("--- loading done ---") 
        console.log("--- --- ---- --- ---")
    };

    let initPromise = makeTimedPromise(init());
    let savingPromise = new Promise<any>(resolve => resolve(null)); // default resolved promise

    $: combinedPromise = Promise.all([initPromise, savingPromise]);

    function makeTimedPromise<T>(promise: Promise<T>, milliseconds = 5000): Promise<T> {
        return new Promise((resolve, reject) => {
            promise.then(resolve).catch(reject);
            setTimeout(() => reject("timeout"), milliseconds);
        })
    }

    function save() {
        let p1 = resourceManager.get().save();
        let p2 = data.save();
        savingPromise = makeTimedPromise(Promise.all([p1, p2]));
    }

    async function asyncSave() {
        let result: {id:number, name:string} = await new Promise(resolve => {
            // this is a AbstractGetTextPrompt
            ui.blockingPopup.set({
                componentType: SaveProjectPopUp as any,
                data: {},
                resolve,
            });
        });
        if(result) {
            let p1 = result.id < 0? resourceManager.get().save() : resourceManager.get().save(result.id);
            let p2 = data.save();
            savingPromise = makeTimedPromise(Promise.all([p1, p2]));
        }
    }

    async function asyncLoad() {
        let result: {id:number, name:string} = await new Promise(resolve => {
            // this is a AbstractGetTextPrompt
            ui.blockingPopup.set({
                componentType: LoadProjectPopUp as any,
                data: {},
                resolve,
            });
        });
        if(result) {
            let p1 = resourceManager.get().load(undefined, result.id);
            let p2 = globalData.load();
            savingPromise = makeTimedPromise(Promise.all([p1, p2]));
            cards.reset();
        }
    }

    async function exportData() {
        let obj = await resourceManager.get().getSerializedData();
        
        const textData = JSON.stringify(obj);
        const filename = `${resourceManager.get().settings.title}.txt`;

        _downloadTextFile(filename, textData, "text/plain");

    }

    async function exportGame() {
        let obj = await resourceManager.get().getSerializedData();
        let textData = JSON.stringify(obj);

        let htmltext: string;
        try {
            let gameFileResponse = await fetch(location.href); // just fetches itself, works in a single-file build
            htmltext = await gameFileResponse.text();
        } catch(e) {
            throw new Error("There is no way to get the original source for exporting, therefore we can not export the game. Consider running the game in a server environment, or try a different browser.")
        }

        let parser = new DOMParser();
        let htmlDoc = parser.parseFromString(htmltext, "text/html");
        let gameDataElmt = htmlDoc.querySelector("script[type=gamedata]");
        gameDataElmt.textContent = textData;
        
        let licenseComment = htmlDoc.createComment(`LICENSE (game data): \n${resourceManager.get().settings.LICENSE}\n`);

        gameDataElmt.parentElement.insertBefore(licenseComment, gameDataElmt);
        

        let text = htmlDoc.documentElement.innerHTML;

        const filename = `${resourceManager.get().settings.title}.html`;

        _downloadTextFile(filename, text, "text/html");
    }

    function _downloadTextFile(filename: string, textContent: string, mimeType: string = "text/plain") {
        var element = document.createElement("a");
        element.setAttribute("href", `data:${mimeType};charset=utf-8,` + encodeURIComponent(textContent));
        element.setAttribute("download", filename);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    
    async function importData() {
        let element = document.createElement("input");
        element.setAttribute("type", "file");
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        let result: File = await new Promise((resolve) => element.addEventListener("change", () => {
            if (element.files && element.files[0]) {
                element.innerHTML = element.files[0].name;
                resolve(element.files[0]);
            } else {
                resolve(null);
            }
        }));
        document.body.removeChild(element);

        if(result) {
            let fileTextContent = await result.text();
            let gameData = "";

            if(result.type == "text/html") {
                let parser = new DOMParser();
                let htmlDoc = parser.parseFromString(fileTextContent, "text/html");
                gameData = htmlDoc.querySelector("script[type=gamedata]").textContent;
            } else {
                gameData = fileTextContent;
            }

            await resourceManager.get().load(gameData);
        }
    }

    function keyPress(event: KeyboardEvent) {
        if(event.ctrlKey && event.key == "s") {
            event.preventDefault();
            save();
        }
    }

    document.onkeydown = keyPress;
    
    function windowResize() {
        document.body.style.height = `${innerHeight}px`
    }
    windowResize();

    let isFullscreen = false;

    function toggleFullscreen() {
        if(document.fullscreenElement) {
            document.exitFullscreen()
            isFullscreen = false;
        } else {
            document.body.parentElement.requestFullscreen();
            isFullscreen = true;
        }
    }


</script>

<svelte:head>
    <title>{$resourceManager.settings.title} | trash engine</title>
</svelte:head>

<svelte:window on:resize={windowResize}></svelte:window>

{#await initPromise}
    <div class=loading>
        <Icon />
        loading...
    </div>
{:then} 
{#await savingPromise}
    <div class=saving>
        <Icon />
        saving...
    </div>
{:then} 
    <header>
        <div>
            <Icon />
            <!-- <h2>trash engine</h2> -->
            <span class=spacer></span>
            <input type="text" bind:value={$resourceManager.settings.title}>
        </div>
        <ul class="topbar">
            <li><button on:click={() => openCard(Resources, false)}>   <AtlasIcon id={11} /> resources </button></li>
            <li><button on:click={() => openCard(Settings, false)}>           <AtlasIcon id={43} /> settings  </button></li>
            <li><button on:click={() => openCard(GamePreview, false)}> <AtlasIcon id={75} /> game      </button></li>
            <li><button on:click={() => openCard(Reference, false)}>   <AtlasIcon id={59} /> reference      </button></li>
            <li><button on:click={async() => await asyncSave()}>       <AtlasIcon id={7}  /> save      </button></li>
            <li><button on:click={async() => await asyncLoad()}>       <AtlasIcon id={6}  /> load      </button></li>
            <li><button on:click={() => exportGame()}>                 <AtlasIcon id={57} /> export (game)    </button></li>
            <li><button on:click={() => exportData()}>                 <AtlasIcon id={57} /> export (data)    </button></li>
            <li><button on:click={() => importData()}>                 <AtlasIcon id={58} /> import    </button></li>
            <li><button on:click={toggleFullscreen}>
                {#if isFullscreen}
                    <AtlasIcon id={19} height={16}></AtlasIcon>
                    {:else}
                    <AtlasIcon id={20} height={16}></AtlasIcon>
                {/if}
                fullscreen
            </button></li>
            <!-- <li><button on:click={async() => (await asyncYesNoPopup("REALLY?")) && database.deleteDatabase()}>DELETE DATA</button></li> -->
        </ul>
    </header>
    <Main bind:this={main}></Main>

    {#if $blockingPopup}
        <svelte:component this={$blockingPopup.componentType} bind:prompt={$blockingPopup} />
    {/if}
{:catch err}
 <!-- init promise fail -->
 <p>saving failed</p>
 <pre>err.name</pre>
 <pre>err.message</pre>
 {/await}
 {:catch err}
 <!-- save promise fail -->
 <p>loading the app failed: </p>
 <pre>{err.name}</pre>
 <pre>{err.message}</pre>
{/await}

<style>
    .spacer {
        width: 4px;
    }

    input {
        background-color: var(--bg-color);
        border-color: var(--main-color);
        color: var(--main-color);
        margin: 0;
        padding: 4px 6px;
    }

    /* header img {
        margin-right: 8px;
    } */
    
    header div {
        display: flex;
        flex-direction: row;
        padding: 4px;
        /* vertical-align: middle; */
        font-family: sans-serif;
    }

    ul.topbar {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        border-bottom: 1px solid var(--main-color);
        background-color: var(--bg-color);
        /* padding: 8px; */

        margin-bottom: 4px;;
    }

    ul.topbar > li {
        /* border-right: 1px solid var(--main-color); */
        padding: 4px;

    }
</style>
