<script lang="ts">
    import { gameData } from "../../../modules/game/game_data";
    import { getDisplayName } from "../../../modules/names";
    import Resource from "../../../modules/structs/resource";

    export let id: string;
    export let label: string = "";

    export let resourceType: typeof Resource = Resource;
    export let resource: Resource|null = null;

    // let selectedUUID = resource?.uuid || "";

    $: resources = $gameData.getResourceTypeStore(resourceType);
    // $: resource = $resources.find(x => x.uuid === selectedUUID) || null;
    $: rDisplayName = getDisplayName(resourceType, "lower")

</script>

<label for={id}>
    {label}<slot />
</label>
<select {id} bind:value={resource}>
    <option value={null}>(select {rDisplayName})</option>
    {#each $resources as sprite, i}
        <option value={sprite}>{sprite.name}</option>
    {/each}
</select>
