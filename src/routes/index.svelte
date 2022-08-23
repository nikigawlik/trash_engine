<svelte:head>
    <title>ngine</title>
    <link rel="stylesheet" href="reset.css">
    <link rel="stylesheet" href="main.css"> 
</svelte:head>

<script lang="ts">

    let main: Main | null;

    onMount(async () => {
        console.log("--- window.onload ---")
        // initialize different modules
        await database.init([Sprite, Room, Folder, Instance]);
        // await ResourceManager.init();
        {
            console.log("load app...");
            await data.load();

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
            <li><button on:click={async() => (await asyncYesNoPopup("REALLY?")) && deleteDatabase()}>DELETE DATA</button></li>
        </ul>
    </header>
    <Main bind:this={main}></Main>
</body>