<script lang="ts">
    export let value: string;
    export let label: string = "";
    export let id: string;
    export let useTextarea = false;
</script>

<label for={id}>
    {label}<slot />
</label>
{#if useTextarea}
<textarea {id} bind:value={value}></textarea>
{:else}
<input {id} type="text" bind:value={value}/>
{/if}