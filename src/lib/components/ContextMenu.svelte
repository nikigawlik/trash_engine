<script context="module" lang="ts">
    export interface ContextMenuOption {
        text: string
        callback: () => Promise<void>
    }

    export interface ContextMenuData {
        title: string
        options: ContextMenuOption[],
        x: number
        y: number
    }
</script>

<script lang="ts">
    import { onMount } from "svelte";
    import AtlasIcon from "./AtlasIcon.svelte";

    export let data: ContextMenuData|null;

    let buttonElements: HTMLElement[];
    $: buttonElements = []

    $: data && buttonElements[0]?.focus()

    function loseFocus() {
        data = null;
    }

    function onFocusOut(evt: FocusEvent) {
        // lose focus if user tabs to another element
        if(!evt.relatedTarget || !(evt.relatedTarget instanceof HTMLElement) || !buttonElements.includes(evt.relatedTarget)) 
            loseFocus();
    }

    function onClickOption(evt: MouseEvent, opt: ContextMenuOption) {
        opt.callback(); 
        evt.stopPropagation(); 
        data = null;
    }

</script>

{#if data}
    <!-- <span class=dummy> -->
        <!-- 

         -->
        <ul
        style:left={data.x - 5}px 
        style:top={data.y - 5}px
        on:mouseleave={loseFocus}
        on:focusout={onFocusOut}
        >
            <li class=resource><slot></slot></li>
            {#each data.options as opt, i}
                <li><button 
                    bind:this={buttonElements[i]} 
                    on:click={ evt => onClickOption(evt, opt) }
                >
                <AtlasIcon id={0} /> {opt.text}
                </button></li>
            {/each}
        </ul>
    <!-- </span> -->
{:else}
    <slot></slot>
{/if}

<style>
    /* .dummy {
        position: relative;
        width: 0;
        height: 0;
    } */
    ul {
        /* position: absolute; */
        background-color: var(--bg-color);
        display: flex;
        flex-direction: column;
        align-items: stretch;

        width: 100%;
        min-width: 10px;
        min-height: 10px;

        border: 1px solid var(--main-color);
    }

    li {
        box-sizing: border-box;
        margin: 0;
        width: 100%;
    }

    button {
        display: block;
        width: 100%;
        min-width: 100px;
        box-shadow: none;
        border: none;
        text-align: left;
    }
    
</style>
