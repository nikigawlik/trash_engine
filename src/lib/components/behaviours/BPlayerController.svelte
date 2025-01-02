
<script lang="ts">
    import { gameData } from "../../modules/game/game_data";
    import { asStore } from "../../modules/store_owner";
    import type Behaviour from "../../modules/structs/behaviour";
    import Sprite from "../../modules/structs/sprite";
    import FNumber from "./fields/FNumber.svelte";
    import FResource from "./fields/FResource.svelte";
    import FSelect from "./fields/FSelect.svelte";
    import FToggle from "./fields/FToggle.svelte";
    
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
    let collisionSprite = $gameData.getResource(collisionSpriteUUID, Sprite) || null;
    $: collisionSpriteUUID = collisionSprite?.uuid || "";

    let flipSprite: boolean = behaviour.data.flipSprite != undefined? behaviour.data.flipSprite : true;
    let roomTransit = behaviour.data.roomTransit != undefined? behaviour.data.roomTransit : true;

    $: selectedCollisionSpriteStore = asStore($gameData.getResource(collisionSpriteUUID, Sprite))

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

${roomTransit? "persist(me, 2);":""}

onUpdate(() => {

${
moveMode == "grid"?
`
// -- grid movement --

let hor = keyIsPressed("KeyD", "ArrowRight") - keyIsPressed("KeyA", "ArrowLeft");
let ver = keyIsPressed("KeyS", "ArrowDown") - keyIsPressed("KeyW", "ArrowUp");

xspd = hor * ${gridCellWidth};
yspd = ver * ${gridCellHeight};
`
:
`
// -- contiuous movement --

let hor = keyIsDown("KeyD", "ArrowRight") - keyIsDown("KeyA", "ArrowLeft");
let ver = keyIsDown("KeyS", "ArrowDown") - keyIsDown("KeyW", "ArrowUp");

xspd = hor * moveSpeed;
yspd = ver * moveSpeed;
`
}
${
$selectedCollisionSpriteStore?
`
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
`
// flip sprite
if(xspd != 0) imgScaleX = Math.sign(xspd);`:
""
}
${
roomTransit? `
// room transitions
if(x > roomWidth) {
  xx -= roomWidth;
  x -= roomWidth;
  goToNextRoom();
}
if(y > roomHeight) {
  yy -= roomHeight;
  y -= roomHeight;
  goToNextRoom();
}
if(x < 0) {
  xx += roomWidth;
  x += roomWidth;
  goToPreviousRoom();
}
if(y < 0) {
  yy += roomHeight;
  y += roomHeight;
  goToPreviousRoom();
}
`:""}
});
`

    let sprites = $gameData.getResourceTypeStore(Sprite);

</script>

<fieldset>
    <p>
        Makes the sprite respond to WASD / arrow keys inputs to move around. The movement
        can be either grid based or continuous.
    </p>
    <hr />
    <FSelect id="moveMode" bind:value={moveMode} options={["continuous", "grid"]} label="movement"  />
    {#if moveMode == "continuous"}
    <FNumber id="moveSpeed" bind:value={moveSpeed}> &mdash; move speed </FNumber>
    {/if}
    {#if moveMode == "grid"}
    <FNumber id="gridCellWidth" bind:value={gridCellWidth} min={0}> &mdash; cell width </FNumber>
    <FNumber id="gridCellHeight" bind:value={gridCellHeight} min={0}> &mdash; cell height </FNumber>
    {/if}
    <FSelect id="smoothMode" bind:value={smoothMode} options={["none", "smooth"]}> smoothing </FSelect>
    {#if smoothMode == "smooth"}
    <FNumber id="lerpSpeed" bind:value={lerpSpeed}> &mdash; speed </FNumber>
    {/if}
    <FResource id="collisionSprite" bind:resource={collisionSprite} resourceType={Sprite} > collision with </FResource>
    <FToggle id="flipSprite" bind:value={flipSprite}>align sprite with movement </FToggle>
    <FToggle id="roomTransit" bind:value={roomTransit}>transition to next/previous automatically </FToggle>
</fieldset>


<style>
    
    p {
        max-width: max(15rem);
    }

</style>