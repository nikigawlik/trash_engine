
<script lang="ts">
import { data } from "src/modules/globalData";

    let darkMode = $data.editor.settings.darkMode;
    let subFolders = $data.editor.settings.subFolders;
    let openResourcesMaximized = $data.editor.settings.openResourcesMaximized;

    $: data.update(d => { d.editor.settings.darkMode = darkMode;  return d; });
    $: data.update(d => { d.editor.settings.subFolders = subFolders;  return d; });
    $: data.update(d => { d.editor.settings.openResourcesMaximized = openResourcesMaximized;  return d; });

    // TODO apply settings -> dark mode in html tag?
</script>

<p><label>dark mode \xa0 <input type="checkbox" bind:value={darkMode} /></label></p>
<p><label>full resource hierarchy \xa0 <input type="checkbox" bind:value={subFolders} /></label></p>
<p><label>open resources maximized \xa0 <input type="checkbox" bind:value={openResourcesMaximized} /></label></p>

