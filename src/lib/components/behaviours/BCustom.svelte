<script lang="ts">
    import type Behaviour from "../../modules/game/behaviour";
    import { resourceManager } from "../../modules/game/ResourceManager";
    import AtlasIcon from "../AtlasIcon.svelte";

    // export let sprite: Sprite;
    export let behaviour: Behaviour;
    $: behaviour.iconID = 42;

    let props: string[] = behaviour.props;
    let code: string = behaviour.code;

    let behaviourStore = $resourceManager.getResourceStore(behaviour);
    
    $: behaviour.props = props;
    $: behaviour.code = code

    let focus = false;
    function propInputKeyDown(keyEvt: KeyboardEvent, index: number) {
        if(keyEvt.key == "Enter") {
            props.splice(index + 1, 0, "");
            focus = true;
            props = props;
        }
    }
    function propCreate(el: HTMLElement) {
        if(focus) el.focus();
        focus = false;
        console.log("hi")
    }
</script>
<label><input type="text" bind:value={$behaviourStore.name} /></label>
<p>properties: </p>
<ul>
    {#each props as prop, i}
        <li>
            <input 
                type="text" 
                bind:value={props[i]} 
                on:keydown={(evt) => propInputKeyDown(evt, i)}
                use:propCreate
            />
            <button class="borderless" on:click={() => { props = props.filter(x => x != prop) }}><AtlasIcon id={21} /></button>
        </li>
    {/each}
    <li>
        <button class="" on:click={() => { props.push(`prop_${props.length}`); props = props; }}>
            <AtlasIcon id={22} /> 
            add property 
        </button> 
    </li>
</ul>
<p>code: </p>
<textarea bind:value={code}></textarea>

<style>
    textarea {
        flex-grow: 1;
        overflow-wrap: normal;
        width: 100%;
        resize: vertical;
    }
    
    p {
        margin-top: 1rem;
    }

    li {
        margin: .2rem 0;
    }
</style>