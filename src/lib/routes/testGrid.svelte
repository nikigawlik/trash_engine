<script lang="ts">
    import Settings from "../components/Settings.svelte";
    import { CardInstance } from "../modules/cardManager";
import { resourceManager } from "../modules/game/ResourceManager";
    import { currentTheme, data } from "../modules/globalData";


    let columns = (new Array(25)).fill(0).map((x, i) => `col ${i}`);

    let fontsLink: HTMLLinkElement = null;

    const queryParamRegex = /family=([\w\+]+)/gm;
    $: fams = fontsLink?
        Array.from(fontsLink.href.matchAll(queryParamRegex))
        .map(x => x[1])
        .map(x => x.replaceAll("+", " "))
        : [];

    let curFont = "";

    $resourceManager.load();

    $: {
        // let root = document.querySelector(":root")
        let root = document.body;

        root.style.setProperty("--bg-color", $currentTheme.bgColor)
        root.style.setProperty("--main-color", $currentTheme.mainColor)
        root.style.setProperty("--neutral-color", $currentTheme.neutralColor)
        root.style.setProperty("--off-main-color", $currentTheme.offMainColor)
        root.style.setProperty("--off-bg-color", $currentTheme.offBgColor)
    }

    
    const fakeCard = {name:"", position: new DOMRect()} as CardInstance;

</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- fonts -->
<link bind:this={fontsLink} href="https://fonts.googleapis.com/css2?family=Bubblegum+Sans&family=Days+One&family=Fugaz+One&family=Hi+Melody&family=Jua&family=Mansalva&family=Margarine&family=Rammetto+One&display=swap" rel="stylesheet">
</svelte:head>

<main>
    {#each columns as col, i}
        <section 
        style:grid-area={`1 / ${i+1} / span 1 / span 1`}
        style:border={"1px solid var(--off-bg-color)"}
        >
            <h4>{col}</h4>
        </section>
    {/each}

    <header style:grid-area={"1 / 2 / span 1 / span 12"}>
        {#each fams as fam}
            <button 
                on:click={() => curFont=fam}
                class:selected={curFont==fam}
            >{fam}</button>
        {/each}
    </header>

    <section 
    style:grid-area={"2 / 2 / span 24 / span 7"}
    >
        <h3><span style:font-family={curFont}>draw</span></h3>
        <div class="c-cont">
            <canvas width="100" height="100"></canvas>
        </div>
    </section>
    <section style:grid-area={"2 / 10 / span 24 / span 7"}>
        <h3><span style:font-family={curFont}>place</span></h3>
    </section>
    <section style:grid-area={"2 / 18 / span 24 / span 7"}>
        <h3><span style:font-family={curFont}>script</span></h3>
    </section>
    <section style:grid-area={"2 / 18 / span 24 / span 7"}>
        <h3><span style:font-family={curFont}>settings</span></h3>
        
        <p>
            <label for="theme">color theme &nbsp</label>
            <select name="theme" bind:value={$data.editor.settings.currentTheme}>
                {#each $data.editor.settings.themes as theme, i}
                <option value={theme.name}>{theme.name}</option>
                {/each}
            </select>
        </p>
    </section>

</main>

<style>
    section {
        /* border: 1px solid var(--main-color); */
        text-align: left;

        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    main {
        display: grid;
        width: 100vw;
        height: 100vh;

        grid-template-columns: repeat(12, 1rem 1fr) 1rem;
        grid-template-rows: repeat(24, 1fr);
    }

    h3 {
        line-height: 2rem;
        font-size: 2rem;

        background-color: var(--main-color);
        color: var(--bg-color);

        border-radius: .5rem;
    }

    .c-cont {
        width:100%;
        background-color: var(--off-bg-color);
        padding: 1rem;
        margin-top: 1rem;
    }

    canvas {
        width: 300px;
        margin: auto;
        /* background-color: aqua; */
        border: 1px solid var(--off-main-color);
        display: block;
    }

    .selected {
        background-color: var(--main-color);
        color: var(--bg-color);
    }
</style>