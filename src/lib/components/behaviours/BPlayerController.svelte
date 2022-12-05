
<script lang="ts">
    import type Behaviour from "../../modules/structs/behaviour";
    
    // export let sprite: Sprite;
    export let behaviour: Behaviour;
    $: behaviour.iconID = 75;

    let moveMode: "continuous" | "grid"      = behaviour.data.moveMode;
    let smoothMode: "none" | "smooth"        = behaviour.data.smoothMode;
    let unique: boolean                      = behaviour.data.unique;

    let gridCellWidth: number = behaviour.data.gridCellWidth != undefined? behaviour.data.gridCellWidth : 60;
    let gridCellHeight: number = behaviour.data.gridCellHeight != undefined? behaviour.data.gridCellHeight : 60;

    let lerpSpeed: number = behaviour.data.lerpSpeed != undefined? behaviour.data.lerpSpeed : 4;

    $: behaviour.data = {
        moveMode,
        smoothMode,
        unique,
        gridCellWidth,
        gridCellHeight,
        lerpSpeed,
    }

    $: if(behaviour) behaviour.props = ["x", "y", "xspd", "yspd", "xx", "yy"];
    $: if(behaviour) behaviour.code = `
        xspd = 0;
        yspd = 0;
        
        ${
            smoothMode == "smooth"?
            `
        xx = x;
        yy = y;
            ` : ""
        }
        onUpdate(() => {
        ${
            moveMode == "grid"?
            `
            let hor = keyIsPressed("KeyD", "ArrowRight") - keyIsPressed("KeyA", "ArrowLeft");
            let ver = keyIsPressed("KeyS", "ArrowDown") - keyIsPressed("KeyW", "ArrowUp");

            xspd = hor * ${gridCellWidth};
            yspd = ver * ${gridCellHeight};
            `
            :
            `
            let hor = keyIsDown("KeyD", "ArrowRight") - keyIsDown("KeyA", "ArrowLeft");
            let ver = keyIsDown("KeyS", "ArrowDown") - keyIsDown("KeyW", "ArrowUp");

            xspd = hor * 4;
            yspd = ver * 4;
            `
        }
        ${
            smoothMode == "smooth"?
            `
            xx += xspd;
            yy += yspd;
            const l = ${1/(1+lerpSpeed)};
            x = l * xx + (1-l) * x;
            y = l * yy + (1-l) * y;
            `:
            `
            x += xspd;
            y += yspd;
            `
        }
    });
    `

</script>

<table>
    <tr>
        <td>movement: </td>
        <td>
            <select bind:value={moveMode}>
                {#each ["continuous", "grid"] as value}
                <option {value}>{value}</option>
                {/each}
            </select>
        </td>
    </tr>
    {#if moveMode == "grid"}
    <tr>
        <td> &mdash; cell width:</td>
        <td>
            <input type="number" bind:value={gridCellWidth} />
        </td>
    </tr>
    <tr>
        <td> &mdash; cell height:</td>
        <td>
            <input type="number" bind:value={gridCellHeight} />
        </td>
    </tr>
    {/if}
    <tr>
        <td>smoothing: </td>
        <td>
            <select bind:value={smoothMode}>
                {#each ["none", "smooth"] as value}
                <option {value}>{value}</option>
                {/each}
            </select>
        </td>
    </tr>
    {#if smoothMode == "smooth"}
    <tr>
        <td>&mdash; speed:</td>
        <td>
            <input type="number" bind:value={lerpSpeed} min="0" />
        </td>
    </tr>
    {/if}
</table>


<style>
    table {
        width: 100%;
        /* border-collapse: separate;
        border-spacing: .2rem 0; */
    }

    tr>td:last-child * {
        vertical-align: top;
    }

    td {
        padding: .2rem 0;
        line-height: 150%;
    }

    td>select, td>input {
        display: block;
        width: 100%;
    }

</style>