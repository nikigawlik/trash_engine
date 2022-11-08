<script lang="ts">
    
    export let id = 0;
    export let height = 16;

    const w = 50;
    const h = 50;
    const columns = 15;
    const rows = 7;

    $: x = id % columns;
    $: y = ~~(id / columns)

    $: scale = height/50;

</script>

<div 
    class="icon" 
    style:width={w * scale}px
    style:height={h * scale}px
    style:mask-position="-{x*w*scale}px -{y*h*scale}px"
    style:mask-size="{columns*w*scale}px {rows*h*scale}px"
    style:-webkit-mask-position="-{x*w*scale}px -{y*h*scale}px"
    style:-webkit-mask-size="{columns*w*scale}px {rows*h*scale}px"
    alt="icon"
></div>

<style>
    div {
        background-color: var(--main-color);
        mask-image: var(--svg-kenney-icons);
        -webkit-mask-image: var(--svg-kenney-icons);
        display: inline-block;
        vertical-align: bottom;
    }
</style>