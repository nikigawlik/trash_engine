<script lang="ts">
    export let id: string;
    export let value: boolean;
    export let label: string = "";
</script>

<label for="id">
    {label}<slot />
</label>
<input {id} type="checkbox" bind:checked={value}/>
