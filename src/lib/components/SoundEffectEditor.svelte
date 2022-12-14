<script lang="ts">
    import type { CardInstance } from "../modules/cardManager";
    import { resourceManager } from "../modules/game/ResourceManager";
    import type SoundEffect from "../modules/structs/soundEffect";
    import Card from "./Card.svelte";
    import type { Writable } from "svelte/store";
    import { afterUpdate, onMount, tick } from "svelte";

    export let card: CardInstance;

    let uuid = card.uuid;

    $: card.className = "sound-effect-editor"
    $: card.position.width = 350;

    $: soundEffect = $resourceManager.getResourceStore(uuid) as Writable<SoundEffect>;
    $: { card.name = $soundEffect.name }
    
    let canvas: HTMLCanvasElement;
    let canvasCWidth: number;
    let canvasCHeight: number;
    let canvasWidth = 0;
    let canvasHeight = 0;
    $: {
        if(canvasCWidth && canvasCHeight) {
            canvasWidth = canvasCWidth * devicePixelRatio;
            canvasHeight = canvasCHeight * devicePixelRatio;
        }
    }

    $: {
        soundEffect; canvasHeight; canvasWidth;
        updateCanvas();
    }

    async function updateCanvas() {
        await tick();
        updateBufferAndCanvas();
    }

    const sliders = [
        {name: "attack",    min: 1,    max: 50,  step: 1},
        {name: "hold",      min: 1,    max: 200, step: 1},
        {name: "decay",     min: 1,    max: 500, step: 1},
        {name: "freq",      min: 50,   max: 600, step: 1},
        {name: "freqSlide", min: -500, max: 500, step: 1},
        {name: "shape",     min: 0,    max: 100, step: 1},
        {name: "slopes",    min: -50,  max: 50,  step: 1},
        {name: "crunch",    min: 0,    max: 16,  step: 1},
        {name: "subcrunch", min: 0,    max: 16,  step: 1},
    ];

    function setRandom() {
        for(let slider of sliders) {
            $soundEffect.settings[slider.name] = Math.random() * (slider.max - slider.min) + slider.min;
        }
        updateBufferAndCanvas();
    }

    function mutate() {
        for(let slider of sliders) {
            $soundEffect.settings[slider.name] += (Math.random() * 2 - 1) * (slider.max - slider.min) * 0.1;
            $soundEffect.settings[slider.name] = Math.min(Math.max($soundEffect.settings[slider.name], slider.min), slider.max);
        }
        updateBufferAndCanvas();
    }

    function playSound() {
        $soundEffect.play();
    }

    function updateBufferAndCanvas() {
        let ctx = canvas.getContext("2d");
        
        $soundEffect.createBuffer();
        let buffer = $soundEffect._buffer;
        
        // if(!buffer) return;
        let data = buffer.getChannelData(0);
        let px = 0;
        let py = 0;
        ctx.fillStyle = "#222"
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#aaa";
        ctx.beginPath();
        for(let t = 0; t < data.length; t++) {
            const x = t/data.length * canvas.width;
            const y = (data[t] + 1) * canvas.height / 2;
            if(t > 0) {
                //drawln
                ctx.moveTo(px, py);
                ctx.lineTo(x, y);
            }
            px = x;
            py = y;
        }
        ctx.stroke();
    }
</script>


<Card autoFocus={true} contentMinWidth={240} {card}>
    <canvas bind:this={canvas} 
        bind:clientWidth={canvasCWidth}
        bind:clientHeight={canvasCHeight}
        width={canvasWidth}
        height={canvasHeight}
    />
    <div class="buttons">
        <button on:click={ () => { setRandom(); playSound(); } }>random</button>
        <button on:click={ () => { mutate(); playSound(); } }>mutate</button>
    </div>
    <div class="slider-area">
        {#each sliders as slider}
            <label for={slider.name}>{slider.name}</label>
            <input 
                name={slider.name} 
                type="range" 
                bind:value={$soundEffect.settings[slider.name]} 
                min={slider.min} 
                max={slider.max} 
                step={slider.step}
            />
        {/each}
    </div>
    <!-- <label for="srate">srate</label>
    <input type="range" bind:value={$soundEffect.settings.srate} min="0" max="1" /> -->
    <button on:click={() => playSound()}>play sound</button>
</Card>


<style>

    canvas {
        height: 9rem;
        /* width; */
    }

    .buttons {
        display: grid;
        gap: 2px;
        grid-template-columns: 1fr 1fr;
        /* margin: 1rem 0; */
        margin-top: 1rem;
    }
    
    .slider-area {
        display: grid;
        margin: 1rem 0;
        /* width: 100%; */
        /* max-width: 512px; */
        gap: 2px;
        grid-template-columns: 6rem 1fr;
    }

    .slider-area>label {
        grid-column: 1;
        justify-self: start;
    }

    .slider-area>input[type=range] {
        grid-column: 2;
        justify-self: stretch;
    }
    
    input[type=range] {
        height: 1rem;
        background: none;
        border: none;
        -webkit-appearance: none;
    }

    /* input[type=range]:focus {
        outline: none;
    } */

    input[type=range]::-webkit-slider-runnable-track {
        height: 1px;
        cursor: pointer;
        background: var(--off-bg-color);
        border-radius: 2px;
    }

    input[type=range]:focus::-webkit-slider-runnable-track {
        background: #444;
    }

    input[type=range]::-moz-range-track {
        height: 1px;
        cursor: pointer;
        background: var(--off-bg-color);
        border-radius: 2px;
    }

    input[type=range]::-webkit-slider-thumb {
        height: 8px;
        width: 8px;
        border-radius: 2px;
        background: var(--main-color);
        cursor: pointer;
        -webkit-appearance: none;
        margin-top: -4px;
    }

    input[type=range]::-moz-range-thumb {
        height: 8px;
        width: 8px;
        border-radius: 2px;
        background: var(--main-color);
        cursor: pointer;
        -webkit-appearance: none;
        margin-top: -4px;
    }

</style>