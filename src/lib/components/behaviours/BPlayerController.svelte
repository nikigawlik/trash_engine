
<script lang="ts">
    import { resourceManager } from "../../modules/game/ResourceManager";
import type Behaviour from "../../modules/structs/behaviour";
    
    // export let sprite: Sprite;
    export let behaviour: Behaviour;
    $: behaviour.iconID = 75;

    let moveMode: "continuous" | "grid"      = behaviour.data.moveMode;
    let smoothMode: "none" | "smooth"        = behaviour.data.smoothMode;

    let gridCellWidth: number = behaviour.data.gridCellWidth != undefined? behaviour.data.gridCellWidth : 60;
    let gridCellHeight: number = behaviour.data.gridCellHeight != undefined? behaviour.data.gridCellHeight : 60;

    let lerpSpeed: number = behaviour.data.lerpSpeed != undefined? behaviour.data.lerpSpeed : 4;
    let moveSpeed: number = behaviour.data.moveSpeed != undefined? behaviour.data.moveSpeed : 4;
    
    let collisionSpriteUUID: string = behaviour.data.collisionSpriteUUID != undefined? behaviour.data.collisionSpriteUUID : "";

    let flipSprite: boolean = behaviour.data.flipSprite != undefined? behaviour.data.flipSprite : true;

    $: selectedCollisionSpriteStore = $resourceManager.getResourceStore(collisionSpriteUUID);

    $: behaviour.data = {
        moveMode,
        moveSpeed,
        smoothMode,
        gridCellWidth,
        gridCellHeight,
        lerpSpeed,
        collisionSpriteUUID,
        flipSprite
    }

    $: if(behaviour) behaviour.props = ["xspd", "yspd", "xx", "yy"];
    $: if(behaviour) behaviour.code = `
        xspd = 0;
        yspd = 0;
        
        // should not do it like this blabla
        xx = x;
        yy = y;

        const moveSpeed = ${moveSpeed};

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

            xspd = hor * moveSpeed;
            yspd = ver * moveSpeed;
            `
        }
        ${
            $selectedCollisionSpriteStore?
            `
            // collision
            // for(let i = 0; i < Math.abs(xspd); i++) {
            //     if(!collisionAt(me, ${$selectedCollisionSpriteStore.name}, xx + Math.sign(xspd), yy))
            //       xx += Math.sign(xspd);
            // }
            // for(let i = 0; i < Math.abs(yspd); i++) {
            //     if(!collisionAt(me, ${$selectedCollisionSpriteStore.name}, xx, yy + Math.sign(yspd)))
            //       yy += Math.sign(yspd);
            // }
            if(!collisionAt(me, ${$selectedCollisionSpriteStore.name}, xx + xspd, yy))
                xx += xspd;
            if(!collisionAt(me, ${$selectedCollisionSpriteStore.name}, xx, yy + yspd))
                yy += yspd;
            ` :
            `
            xx += xspd;
            yy += yspd;
            `
        }
        ${
            smoothMode == "smooth"?
            `
            const l = ${1-1/(1+lerpSpeed/10)};
            x = l * xx + (1-l) * x;
            y = l * yy + (1-l) * y;
            `:
            `
            x = xx;
            y = yy;
            `
        }
        ${
            flipSprite?
            "if(xspd != 0) imgScaleX = Math.sign(xspd);":
            ""
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
    {#if moveMode == "continuous"}
    <tr>
        <td> &mdash; move speed:</td>
        <td>
            <input type="number" bind:value={moveSpeed} />
        </td>
    </tr>
    {/if}
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
    <tr>
        <td>collision: </td>
        <td>
            <select bind:value={collisionSpriteUUID}>
                <option value="">(no collision)</option>
                {#each $resourceManager.getSprites() as sprite}
                    <option value={sprite.uuid}>{sprite.name}</option>
                {/each}
            </select>
        </td>
    </tr>
    <tr>
        <td>flip sprite: </td>
        <td><input type="checkbox" bind:checked={flipSprite}></td>
    </tr>
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