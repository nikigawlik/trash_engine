
<script lang="ts">
import type { CardInstance } from "../modules/cardManager";
    import { deleteDatabase } from "../modules/database";
    import { asyncYesNoPopup } from "../modules/ui";

import { data } from "./../modules/globalData";
import Card from "./Card.svelte";
    export let card: CardInstance;
    $: card.name = "settings";

    // TODO bring back subfolders
    // let subFolders = $data.editor.settings.subFolders;
    // $: data.update(d => { d.editor.settings.subFolders = subFolders;  return d; });
    
    let darkMode = $data.editor.settings.darkMode;
    $: data.update(d => { d.editor.settings.darkMode = darkMode; return d; });
    
    let openResourcesMaximized = $data.editor.settings.openResourcesMaximized;
    $: data.update(d => { d.editor.settings.openResourcesMaximized = openResourcesMaximized;  return d; });
    
    async function deleteData() {
        await asyncYesNoPopup(`Do you REALLY want to delete all save data?\n\n This includes all saved projects on this domain (${location.host})?`) && deleteDatabase();
    }
</script>

<Card card={card}>
    <p><label>dark mode &nbsp <input type="checkbox" bind:checked={darkMode} /></label></p>
    <!-- <p><label>full resource hierarchy &nbsp <input type="checkbox" bind:checked={subFolders} /></label></p> -->
    <p><label>open resources maximized &nbsp <input type="checkbox" bind:checked={openResourcesMaximized} /></label></p>
    <p><button on:click={deleteData}>DELETE ALL SAVE DATA</button></p>
</Card>

<style>
</style>
