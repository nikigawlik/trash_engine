
<script lang="ts">

import { version } from "../../../../package.json";
import { CardInstance, openCard } from "../../modules/cardManager";
import { deleteDatabase } from "../../modules/database";
import { gameData } from "../../modules/game/game_data";
import { downloadTextFile, sanitizeFileName } from "../../modules/game/utils";
import { data } from "../../modules/globalData";
import { logger } from "../../modules/logger";
import { asStore } from "../../modules/store_owner";
import { asyncGetTextPopup, asyncYesNoPopup } from "../../modules/ui";
import FColor from "../behaviours/fields/FColor.svelte";
import FText from "../behaviours/fields/FText.svelte";
import Card from "../Card.svelte";
import Log from "./Log.svelte";

    export let card: CardInstance;
    $: card.name = "settings";

    async function deleteData() {
        await asyncYesNoPopup(`Do you REALLY want to delete all save data?\n\n This includes all saved projects on this domain (${location.host})?`) && deleteDatabase();
    }

    
    async function saveDebugLog() {
        // let events = logger.events.map(ev => `${ev.timestamp}: ${ev.message} ${JSON.stringify(ev.data)}`);

        const textData = logger.getTextLog("message");
        const filename = sanitizeFileName(`${$gameData.settings.title}__debug_log.txt`);

        downloadTextFile(filename, textData, "text/plain");
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

    $: gameSettings = asStore($gameData.settings, "gameData.settings");
    $: {
      console.log($gameSettings.colorPalette);
      }
</script>

<Card card={card} autoFocus={true}>
    <p>running tash engine version {version}</p>

    <h2>game settings:</h2>
    
    {#if $gameSettings}
    <FText id="licenseText" bind:value={$gameSettings.LICENSE} useTextarea={true}>
      license info included in the build: 
    </FText>
    <details>
      <summary>sprite colors</summary>
      <fieldset>
        {#each $gameSettings.colorPalette as color, i}
        <FColor bind:value={$gameSettings.colorPalette[i]} id="palette-color-{i}">sprite color {i}</FColor>
        {/each}
      </fieldset>
    </details>
    {/if}

    <h2>editor settings: </h2>
    <p>
      <label for="theme">color theme &nbsp</label>
      <select name="theme" bind:value={$data.editor.settings.currentTheme}>
        {#each $data.editor.settings.themes as theme, i}
          <option value={theme.name}>{theme.name}</option>
        {/each}
      </select>
    </p>
    <p><button on:click={editThemes}>edit themes</button></p>
    <!-- <p><input type="text" bind:value={$data.editor.settings.currentFont}></p> -->
    <p><label>open resources maximized &nbsp <input type="checkbox" bind:checked={$data.editor.settings.openResourcesMaximized} /></label></p>
    <p><label>show warning before leaving app &nbsp <input type="checkbox" bind:checked={$data.editor.settings.showWarningBeforeClosingApp} /></label></p>
    <p><button on:click={deleteData}>DELETE ALL SAVE DATA</button></p>
    <details>
      <summary>debug settings</summary>
      <p><label>show ordinals &nbsp <input type="checkbox" bind:checked={$data.editor.settings.showOrdinals} /></label></p>
      <p><button on:click={saveDebugLog}>save debug log</button></p>
      <p><button on:click={() => openCard(Log)}>exp. remote logging</button></p>
    </details>
 
</Card>

<style>
  h2 {
    margin-top: 1rem;
    text-decoration: underline;
  }

  p, h2 {
    margin-bottom: var(--size-2);
  }
</style>
