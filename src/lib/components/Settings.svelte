
<script lang="ts">
import type { CardInstance } from "../modules/cardManager";
import { deleteDatabase } from "../modules/database";
import { asyncYesNoPopup } from "../modules/ui";
import { data } from "./../modules/globalData";
import Card from "./Card.svelte";
import { resourceManager } from "../modules/game/ResourceManager";

    export let card: CardInstance;
    $: card.name = "settings";

    async function deleteData() {
        await asyncYesNoPopup(`Do you REALLY want to delete all save data?\n\n This includes all saved projects on this domain (${location.host})?`) && deleteDatabase();
    }
</script>

<Card card={card}>
    <h2>editor: </h2>
    <p><label>dark mode &nbsp <input type="checkbox" bind:checked={$data.editor.settings.darkMode} /></label></p>
    <p><label>open resources maximized &nbsp <input type="checkbox" bind:checked={$data.editor.settings.openResourcesMaximized} /></label></p>
    <p><label>show warning before leaving app &nbsp <input type="checkbox" bind:checked={$data.editor.settings.showWarningBeforeClosingApp} /></label></p>
    <p><button on:click={deleteData}>DELETE ALL SAVE DATA</button></p>
    <p></p>
    <h2>game:</h2>
    <p><label for="licenseText">license info included in the build: </label></p>
<textarea name="licenseText" bind:value={$resourceManager.settings.LICENSE}></textarea>
    
</Card>

<style>
  h2 {
    margin-bottom: 1rem;
    text-decoration: underline;
  }

  textarea {
    resize: vertical;
  }
</style>
