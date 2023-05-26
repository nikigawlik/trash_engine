
<script lang="ts">
import type { CardInstance } from "../modules/cardManager";
import { deleteDatabase } from "../modules/database";
import { asyncGetTextPopup, asyncYesNoPopup } from "../modules/ui";
import { data } from "./../modules/globalData";
import Card from "./Card.svelte";
import { resourceManager } from "../modules/game/ResourceManager";
import { version } from "../../../package.json"

    export let card: CardInstance;
    $: card.name = "settings";

    async function deleteData() {
        await asyncYesNoPopup(`Do you REALLY want to delete all save data?\n\n This includes all saved projects on this domain (${location.host})?`) && deleteDatabase();
    }

    async function editThemes() {
      let result = await asyncGetTextPopup("enter valid json:", JSON.stringify($data.editor.settings.themes, undefined, 2));
      if(result) {
        try {
          let themes = JSON.parse(result);
          // enough validation for me lol
          if(themes instanceof Array) {
            $data.editor.settings.themes = themes;
          }
        } catch(e) {
          console.log("invalid json")
        }
      }
    }
</script>

<Card card={card}>
    <p>running tash engine version {version}</p>
    <h2>editor: </h2>
    <p>
      <label for="theme">color theme &nbsp</label>
      <select name="theme" bind:value={$data.editor.settings.currentTheme}>
        {#each $data.editor.settings.themes as theme, i}
          <option value={theme.name}>{theme.name}</option>
        {/each}
      </select>
    </p>
    <p><button on:click={editThemes}>edit themes</button></p>
    <p><label>open resources maximized &nbsp <input type="checkbox" bind:checked={$data.editor.settings.openResourcesMaximized} /></label></p>
    <p><label>show warning before leaving app &nbsp <input type="checkbox" bind:checked={$data.editor.settings.showWarningBeforeClosingApp} /></label></p>
    <p><button on:click={deleteData}>DELETE ALL SAVE DATA</button></p>
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
