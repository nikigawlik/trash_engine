
<script lang="ts">
import type { CardInstance } from "../modules/cardManager";

import { data } from "./../modules/globalData";
import Card from "./Card.svelte";
    export let card: CardInstance;
    $: card.name = "settings";

    let darkMode = $data.editor.settings.darkMode;
    let subFolders = $data.editor.settings.subFolders;
    let openResourcesMaximized = $data.editor.settings.openResourcesMaximized;

    $: data.update(d => { d.editor.settings.darkMode = darkMode; return d; });
    $: data.update(d => { d.editor.settings.subFolders = subFolders;  return d; });
    $: data.update(d => { d.editor.settings.openResourcesMaximized = openResourcesMaximized;  return d; });

    // TODO apply settings -> dark mode in html tag?
</script>

<Card card={card}>
    <p><label>dark mode &nbsp <input type="checkbox" bind:checked={darkMode} /></label></p>
    <p><label>full resource hierarchy &nbsp <input type="checkbox" bind:checked={subFolders} /></label></p>
    <p><label>open resources maximized &nbsp <input type="checkbox" bind:checked={openResourcesMaximized} /></label></p>
</Card>

