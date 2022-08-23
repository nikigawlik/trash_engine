
<script lang="ts">
    export let buttons: [];
    // export let uuid: string;
</script>

<ul 
class="context-menu" 
style:left=0px 
style:right=0px
>
    {#each buttons as str}
        <li><button>{str}</button></li>
    {/each}
</ul>
<!-- elmt.onmouseleave = () => elmt.remove();
elmt.onclick = () => elmt.remove(); -->
