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
    import Log from "./Log.svelte";
    import Reference from "./Reference.svelte";
    import Resources from "./Resources.svelte";
    import RoomEditor from "./RoomEditor.svelte";
    import Settings from "./Settings.svelte";

    export let card: CardInstance;
    $: card.name = "Trash Engine";

    
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

    let buttons = [];
    let i = 0;
    buttons[i++] = { iconID: 33, onClick: clearProject, text: "new project" };
    buttons[i++] = { iconID: 75, onClick: () => openCard(GamePreview), text: "play" };
    buttons[i++] = { iconID: 59, onClick: () => openCard(Reference), text: "help" };
    buttons[i++] = { iconID: 57, onClick: () => exportGame(), text: "export (game)" };
    buttons[i++] = { iconID: 57, onClick: () => exportData(), text: "export (data)" };
    buttons[i++] = { iconID: 58, onClick: () => importData(), text: "import" };
    buttons[i++] = { iconID: 43, onClick: () => openCard(Settings), text: "settings" };
    const fullscreenButtonIndex = i; // remember for later, doing it with the index triggers Svelte's reactivity, without updating the entire array
    buttons[i++] = { iconID: 19, onClick: toggleFullscreen, text: "fullscreen" };
    buttons[i++] = { iconID: 0, onClick: () => openCard(Log), text: "logging (dev)" };


    $: {
        buttons[fullscreenButtonIndex].iconID = isFullscreen? 19 : 20;
    }



</script>

<Card {card} contentMinWidth={100} hasCornerButtons={false}>
    
    <ul class="topbar">
        {#each buttons as button}
        <li>
            <button on:click={button.onClick} class="borderless alt">
                <AtlasIcon id={button.iconID} height={24} /> <span >{button.text}</span>
            </button>
        </li>
        {/each}
    </ul>
</Card>

<style>
    .topbar {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        gap: var(--size-1)
    }
    .topbar button {
        width: 100%;
        text-align: left;

        vertical-align: middle;
        line-height: 1.5rem;
    }
</style>