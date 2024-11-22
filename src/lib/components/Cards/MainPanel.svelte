<script lang="ts">
    import { CardInstance, cards, openCard } from "../../modules/cardManager";
    import { gameData } from "../../modules/game/game_data";
    import { loadDefaultProject, loadGameData } from "../../modules/game/save_load";
    import { downloadTextFile, sanitizeFileName } from "../../modules/game/utils";
    import { serialize } from "../../modules/serialize";
    import { asStore } from "../../modules/store_owner";
    import Room from "../../modules/structs/room";
    import * as ui from "../../modules/ui";
    import AtlasIcon from "../AtlasIcon.svelte";
    import Card from "../Card.svelte";
    import GamePreview from "./GamePreview.svelte";
    import Reference from "./Reference.svelte";
    import Resources from "./Resources.svelte";
    import RoomEditor from "./RoomEditor.svelte";
    import Settings from "./Settings.svelte";

    export let card: CardInstance;
    $: card.name = "main panel";

    
    $: gameSettings = $gameData ? asStore($gameData.settings, "gameData.settings") : null;

    
    let isFullscreen = false;

    function toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            isFullscreen = false;
        } else {
            document.body.parentElement.requestFullscreen();
            isFullscreen = true;
        }
    }

    
    async function clearProject() {
        let res = await ui.asyncYesNoPopup(
            "Do you really want to start over?",
            true,
        );
        if (res) {
            await loadDefaultProject();
            cards.reset();
            openCard(Resources);
            let rooms = $gameData.getAllOfResourceType(Room);
            openCard(RoomEditor, rooms[0].uuid);
        }
    }

    async function exportData() {
        let obj = await serialize($gameData);

        const textData = JSON.stringify(obj);
        const filename = sanitizeFileName(`${$gameData.settings.title}.json`);

        downloadTextFile(filename, textData, "text/plain");
    }

    async function exportGame() {
        let obj = await serialize($gameData);
        let textData = JSON.stringify(obj);

        let htmltext: string;
        try {
            let gameFileResponse = await fetch(location.href); // just fetches itself, works in a single-file build
            htmltext = await gameFileResponse.text();
        } catch (e) {
            throw new Error(
                "There is no way to get the original source for exporting, therefore we can not export the game. Consider running the game in a server environment, or try a different browser.",
            );
        }

        let parser = new DOMParser();
        let htmlDoc = parser.parseFromString(htmltext, "text/html");
        let gameDataElmt = htmlDoc.querySelector("script[type=gamedata]");
        gameDataElmt.textContent = textData;

        let licenseComment = htmlDoc.createComment(
            `LICENSE (game data): \n${$gameData.settings.LICENSE}\n`,
        );

        gameDataElmt.parentElement.insertBefore(licenseComment, gameDataElmt);

        let text = htmlDoc.documentElement.innerHTML;

        const filename = sanitizeFileName(`${$gameData.settings.title}.html`);

        downloadTextFile(filename, text, "text/html");
    }

    async function importData() {
        let element = document.createElement("input");
        element.setAttribute("type", "file");
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        let result: File = await new Promise((resolve) =>
            element.addEventListener("change", () => {
                if (element.files && element.files[0]) {
                    element.innerHTML = element.files[0].name;
                    resolve(element.files[0]);
                } else {
                    resolve(null);
                }
            }),
        );
        document.body.removeChild(element);

        if (result) {
            let fileTextContent = await result.text();
            let gameDataJSON = "";

            if (result.type == "text/html") {
                let parser = new DOMParser();
                let htmlDoc = parser.parseFromString(
                    fileTextContent,
                    "text/html",
                );
                gameDataJSON = htmlDoc.querySelector(
                    "script[type=gamedata]",
                ).textContent;
            } else {
                gameDataJSON = fileTextContent;
            }
            let gd = JSON.parse(gameDataJSON);

            await loadGameData(gd);
        }
    }

</script>

<Card {card} contentMinWidth={100} hasCornerButtons={false}>
    <div>
        <!-- <Icon /> -->
        <!-- <span class="spacer"></span> -->
        <p>game title: </p>
        <input type="text" bind:value={$gameSettings.title} />
    </div>
    <div>..</div>
    <ul class="topbar">
        <li>
            <button on:click={clearProject}>
                <AtlasIcon id={33} /> new project
            </button>
        </li>
        <!-- <li><button on:click={() => newResource("sprite", Sprite)}>   <AtlasIcon id={22} /> sprite </button></li>
    <li><button on:click={() => newResource("room", Room)}>   <AtlasIcon id={22} /> room </button></li>
    <li><button on:click={() => newResource("script", Behaviour)}>   <AtlasIcon id={22} /> script </button></li>
    <li><button on:click={() => newResource("sound", SoundEffect)}>   <AtlasIcon id={22} /> sound </button></li> -->
        <li>
            <button on:click={() => openCard(GamePreview)}>
                <AtlasIcon id={75} /> play
            </button>
        </li>
        <li>
            <button on:click={() => openCard(Reference)}>
                <AtlasIcon id={59} /> help
            </button>
        </li>
        <!-- <li><button on:click={async() => await promptSave()}>       <AtlasIcon id={7}  /> save      </button></li> -->
        <!-- <li><button on:click={async() => await asyncLoad()}>       <AtlasIcon id={6}  /> load      </button></li> -->
        <li>
            <button on:click={() => exportGame()}>
                <AtlasIcon id={57} /> export (game)
            </button>
        </li>
        <li>
            <button on:click={() => exportData()}>
                <AtlasIcon id={57} /> export (data)
            </button>
        </li>
        <li>
            <button on:click={() => importData()}>
                <AtlasIcon id={58} /> import
            </button>
        </li>
        <li>
            <button on:click={() => openCard(Settings)}>
                <AtlasIcon id={43} /> settings
            </button>
        </li>
        <li>
            <button on:click={toggleFullscreen}>
                {#if isFullscreen}
                    <AtlasIcon id={19} height={16}></AtlasIcon>
                {:else}
                    <AtlasIcon id={20} height={16}></AtlasIcon>
                {/if}
                fullscreen
            </button>
        </li>
        </ul>
</Card>

<style>
    .topbar {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
    }
    .topbar button {
        width: 100%;
        text-align: left;
    }
</style>