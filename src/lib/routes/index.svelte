<script lang="ts">
    import { onMount } from "svelte";
    import licenseText from "../../../LICENSE?raw";
    import "../../assets/main.css";
    import "../../assets/reset.css";
    import "../../assets/svg.css";
    import Resources from "../components/Cards/Resources.svelte";
    import RoomEditor from "../components/Cards/RoomEditor.svelte";
    import Icon from "../components/Icon.svelte";
    import { openEditorWindow } from "../components/ResourceTreeResource.svelte";
    import SaveProjectPopUp from "../components/SaveProjectPopUp.svelte";
    import { cards, openCard } from "../modules/cardManager";
    import * as database from "../modules/database";
    import { gameData } from "../modules/game/game_data";
    import {
        autoLoadGameData,
        loadDefaultProject,
        loadGameData,
    } from "../modules/game/save_load";
    import { assert, sanitizeFileName } from "../modules/game/utils";
    import { currentTheme, data } from "../modules/globalData";
    import { serialize } from "../modules/serialize";
    import { asStore } from "../modules/store_owner";
    import type Resource from "../modules/structs/resource";
    import Room from "../modules/structs/room";
    import SoundEffect from "../modules/structs/soundEffect";
    import { blockingPopup } from "../modules/ui";
    import * as image_editor from "./../components/ImageEditor.svelte";
    import Main from "./../components/Main.svelte";
    import * as globalData from "./../modules/globalData";
    import * as ui from "./../modules/ui";

    let main: Main | null;

    $: {
        // let root = document.querySelector(":root")
        let root = document.body;

        root.style.setProperty("--bg-color", $currentTheme.bgColor);
        root.style.setProperty("--main-color", $currentTheme.mainColor);
        root.style.setProperty("--neutral-color", $currentTheme.neutralColor);
        root.style.setProperty("--off-main-color", $currentTheme.offMainColor);
        root.style.setProperty("--off-bg-color", $currentTheme.offBgColor);
        // root.style.setProperty("--font-family", `"${$data.editor.settings.currentFont}"`)
        root.style.setProperty("--font-family", $data.editor.settings.currentFont)
    }

    $: {
        window.onbeforeunload =
            $data.editor.settings.showWarningBeforeClosingApp &&
            !import.meta.env.DEV
                ? () => true
                : null;
    }

    let init = async () => {
        console.log("--- window.onload ---");

        // sfx (out of the timeline)
        (async () => {
            await new Promise((resolve) => {
                window.addEventListener("mousedown", resolve);
                window.addEventListener("touchstart", resolve);
                window.addEventListener("keydown", resolve);
            });
            SoundEffect.init();
        })();

        // initialize different modules
        console.log("--- loading start (engine) ---");
        await database.init();
        await globalData.load();
        await autoLoadGameData();
        assert(!!$gameData, "Critical error: save data did not load");
        await image_editor.init();
        console.log("--- loading done ---");
    };

    let initPromise = makeTimedPromise(init());
    let savingPromise = new Promise<any>((resolve) => resolve(null)); // default resolved promise

    $: combinedPromise = Promise.all([initPromise, savingPromise]);

    function makeTimedPromise<T>(
        promise: Promise<T>,
        milliseconds = 5000,
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            promise.then(resolve).catch(reject);
            setTimeout(() => reject("timeout"), milliseconds);
        });
    }

    function makeNonCrashingPromise<T>(promise: Promise<T>): Promise<T | null> {
        return new Promise((resolve, reject) => {
            promise.then(resolve).catch(async (error: Error) => {
                await ui.asyncInfoPopup(`${error.name}: ${error.message}`);
                resolve(null);
            });
        });
    }

    // onMount(() => {
    //     openCard(Reference, false, undefined, undefined, { pageName: "disclaimer" })
    // })

    async function save(id?: number) {
        //throw Error("not implemented");
        
        // TODO remove this
        // let p1 = resourceManager .get().save(id); // id can be undefined -> thats ok
        // let p2 = data.save();

        // savingPromise = makeNonCrashingPromise(makeTimedPromise(Promise.all([p1, p2])));
    }

    async function promptSave() {
        let result: { id: number; name: string } = await new Promise(
            (resolve) => {
                // this is a AbstractGetTextPrompt
                ui.blockingPopup.set({
                    componentType: SaveProjectPopUp as any,
                    data: {},
                    resolve,
                });
            },
        );
        if (result) {
            if (result.id < 0) await save();
            else await save(result.id);
        }
    }

    async function asyncLoad() {
        //throw new Error("not implemented");
        
        // TODO remove this
        // let result: {id:number, name:string} = await new Promise(resolve => {
        //     // this is a AbstractGetTextPrompt
        //     ui.blockingPopup.set({
        //         componentType: LoadProjectPopUp as any,
        //         data: {},
        //         resolve,
        //     });
        // });
        // if(result) {
        //     let p1 = resourceManager .get().load(undefined, result.id);
        //     let p2 = globalData.load();
        //     savingPromise = makeTimedPromise(Promise.all([p1, p2]));
        //     cards.reset();
        // }
    }

    async function exportData() {
        let obj = await serialize($gameData);

        const textData = JSON.stringify(obj);
        const filename = sanitizeFileName(`${$gameData.settings.title}.json`);

        _downloadTextFile(filename, textData, "text/plain");
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

        _downloadTextFile(filename, text, "text/html");
    }

    function _downloadTextFile(
        filename: string,
        textContent: string,
        mimeType: string = "text/plain",
    ) {
        var element = document.createElement("a");
        element.setAttribute(
            "href",
            `data:${mimeType};charset=utf-8,` + encodeURIComponent(textContent),
        );
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

    function keyPress(event: KeyboardEvent) {
        if (event.ctrlKey && event.key == "s") {
            event.preventDefault();
            save();
        }
    }

    document.onkeydown = keyPress;

    function windowResize() {
        document.body.style.height = `${innerHeight}px`;
    }
    windowResize();

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

    async function newResource(
        resourceName: string,
        resourceConstructor: typeof Resource,
    ) {
        let name = await ui.asyncGetTextPopup(
            `Name of the ${resourceName}:`,
            `unnamed ${resourceName}`,
        );
        if (name) {
            let newResource = new resourceConstructor(name);
            $gameData.addResource(newResource);
            openEditorWindow(newResource);
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

    $: gameSettings = $gameData ? asStore($gameData.settings, "gameData.settings") : null;

    let title = "loading...";
    $: {
        if ($gameData) {
            title = $gameData.settings.title;
        }
    }

    onMount(() => {
        // general emergency error handling, so app doesn't just freeze
        const report_error = (msg: string = "unknown error") => {
            let el = document.createElement("div");
            el.innerText = `error - ${msg}`
            let but = document.createElement("button");
            but.onclick = () => location.reload();
            if(!import.meta.env.DEV) 
                setTimeout(() => location.reload(), 200)
            but.innerText = "reload"
            but.style.display = "block"
            el.append(but);
            document.body.innerHTML = "";
            document.body.append(el);
        };

        const handle_rejection = (e: PromiseRejectionEvent) => {
            e.preventDefault();
            report_error(e?.reason);
        };

        const handle_error = (e: ErrorEvent) => {
            e.preventDefault();
            report_error(e?.message);
        };

        window.addEventListener("unhandledrejection", handle_rejection);
        window.addEventListener("error", handle_error);

        return () => {
            window.removeEventListener("unhandledrejection", handle_rejection);
            window.removeEventListener("error", handle_error);
        };
    });

</script>

<svelte:head>
    <title>{title} | trash engine</title>
    {@html `<!-- ${licenseText} -->`}

    //TODO remove
    <!-- <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Bubblegum+Sans&family=Days+One&family=Fugaz+One&family=Hi+Melody&family=Jua&family=Mansalva&family=Margarine&family=Rammetto+One&family=Source+Sans+3&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=IBM+Plex+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet"> -->

</svelte:head>

<svelte:window on:resize={windowResize} />


{#await initPromise}
    <div class="loading">
        <Icon />
        loading...
    </div>
{:then}
    {#await savingPromise}
        <div class="saving">
            <Icon />
            saving...
        </div>
    {:then}
        <header>
            <div>
                <Icon />
                <span class="spacer"></span>
                <!-- <p>game title: </p> -->
                <input type="text" bind:value={$gameSettings.title} />
            </div>
        </header>
        <Main bind:this={main}></Main>
    {:catch err}
        <!-- init promise fail -->
        <p>saving failed</p>
        <pre>{err.name}</pre>
        <pre>{err.message}</pre>
    {/await}
{:catch err}
    <!-- save promise fail -->
    <p>loading the app failed:</p>
    <pre>{err.name}</pre>
    <pre>{err.message}</pre>
{/await}
{#if $blockingPopup}
    <svelte:component
        this={$blockingPopup.componentType}
        bind:prompt={$blockingPopup}
    />
{/if}

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

    header {
        display: flex;
        flex-direction: row;
        /* margin-bottom: var(--size-2); */
        margin-bottom: 0;
    }

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
        align-items: stretch;

        /* border-bottom: 1px solid var(--main-color); */
        background-color: var(--bg-color);
        /* padding: 8px; */

        margin-bottom: 4px;
    }

    ul.topbar > li {
        /* border-right: 1px solid var(--main-color); */
        padding: 4px;
    }
</style>
