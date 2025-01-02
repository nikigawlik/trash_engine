<script lang="ts">
    export let value: string;
    export let label: string = "";
    export let id: string;
</script>

<label for={id}>
    {label}<slot />
</label>
<input {id} type="color" bind:value={value}/>
