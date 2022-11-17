
<script lang="ts">
    import type { SvelteComponent } from "svelte";
    import type { EmitResult } from "typescript";
    import type Behaviour from "../modules/game/behaviour";
    import type Sprite from "../modules/structs/sprite";
    import { blockingPopup } from "../modules/ui";
    import AtlasIcon from "./AtlasIcon.svelte";
    import SelectBehaviourPopUp from "./SelectBehaviourPopUp.svelte";


    export let sprite: Sprite;
    export let behaviour: Behaviour;
</script>




<style>
    /* tr>td:last-child * {
    } */

    td {
        padding: .2rem;
        line-height: 150%;
    }

    /* td>select {
        display: block;
        width: 100%;
    } */

    table {
        border-collapse: collapse;
    }

    table td {
        border: 1px solid var(--main-color)
    }

</style>