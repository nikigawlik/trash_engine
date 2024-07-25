<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    function onClick(event) {
        dispatch('click', event);
        reroll();
    }

    function reroll() {
        // rotation = ~~(Math.random() * 5) * -(rotation > 0? 1 : -1);
        // rotation = Math.random() * 4 - 2
        transX = ~~(Math.random()   * 2 - 1);
        transY = ~~(Math.random()   * 2 - 1);
    }

    let rotation = 0;
    let transX = 0;
    let transY = 0;
    // reroll();
</script>

<button on:click={onClick} style:transform={`rotate(${rotation}deg) translate(${transX}px,${transY}px)`}>
    <slot />
</button>


<style>
    button {
        transition: transform .2s;
    }
</style>