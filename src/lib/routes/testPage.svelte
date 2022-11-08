<script>
    import AtlasIcon from "../components/AtlasIcon.svelte";

</script>

<section>
    <h2>icons:</h2>
    <table>
        {#each (new Array(7)) as _, row}
            <tr>
                {#each (new Array(15)) as _, column}
                    {@const id = row*15 + column}
                    <td> <AtlasIcon {id} height={32}></AtlasIcon> {id} </td>
                {/each}
            </tr>
        {/each}
    </table>
</section>

<style>
    h2 {
        margin: 1rem;
    }

    section {
        margin-top: 1rem;
        display: flex;
        flex-direction: column;
        place-items: center baseline;
    }

    table {
        width: 16rem;
        border-collapse: collapse;
    }
    td {
        border: 1px solid var(--main-color);
    }
</style>