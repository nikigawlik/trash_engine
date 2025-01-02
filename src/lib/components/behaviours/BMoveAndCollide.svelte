
<script lang="ts">
    import { gameData } from "../../modules/game/game_data";
    import type Behaviour from "../../modules/structs/behaviour";
    import Sprite from "../../modules/structs/sprite";
    import FNumber from "./fields/FNumber.svelte";
    import FResource from "./fields/FResource.svelte";
    
    // export let sprite: Sprite;
    export let behaviour: Behaviour;
    $: behaviour.iconID = 75;
    
    // config
    let collideWith: Sprite = $gameData?.getResource(behaviour.data.collideWithUUID, Sprite) || null;
    let followSprite: Sprite = $gameData?.getResource(behaviour.data.followUUID, Sprite) || null;
    let gravity = behaviour.data.gravity || 0;
    let followSpeed = behaviour.data.followSpeed || 1;

    $: behaviour.data = {
        collideWithUUID: collideWith?.uuid || "",
        followUUID: followSprite?.uuid || "",
        gravity,
        followSpeed,
    }

    $: if(behaviour) behaviour.props = ["xspd", "yspd", "collides"];
    $: if(behaviour) behaviour.code = 
`
xspd = yspd || 0;
yspd = xspd || 0;
collides = false;

const grav = ${gravity};
const setzero = true;
const wall = "${collideWith?.uuid || "none"}"; // by uuid
const followSprite = "${followSprite?.uuid || "none"}" // by uuid
const followSpeed = ${followSpeed};

// const wall = ${collideWith?.name || "none"}; // by name
// const follow = ${followSprite?.name || "none"} // by name

onUpdate(slf => {

collides = false;

const followInst = find(followSprite);
if(followInst) {
  const dx = followInst.x-x;
  const dy = followInst.y-y;
  const l = (dx**2 + dy**2)**0.5 || 1;
  const stepSize = Math.min(Math.abs(followSpeed), l) * Math.sign(followSpeed);
  xspd = dx/l * stepSize;
  yspd = dy/l * stepSize;
}

yspd += grav;

// get unstuck from walls / collision
if(collisionAt(slf, wall, x, y))
{
    let dx = 0;
    let dy = 0;
    // add up forces from all colliding instances
    for(let other of instancesAt(slf, wall, x, y)) {
      dx += (x - other.x);
      dy += (y - other.y);
    }

    // find the strongest cardinal direction
    if(Math.abs(dx) > Math.abs(dy)) {
      dx = Math.sign(dx);
      dy = 0;
    } else {
      dx = 0;
      dy = Math.sign(dy); 
    }

    // get unstuck
    const maxSteps = 10;
    for(let i = 0; i < maxSteps; i++) {
      x += dx;
      y += dy;
      if(!collisionAt(me, wall, x, y))
        break;
    }
}

if(!collisionAt(slf, wall, x + xspd, y)) {
   x += xspd;
}
else
for(let i = 0; i < Math.round(Math.abs(xspd)); i++) {
  const dx = Math.sign(xspd);
  if(!collisionAt(slf, wall, x + dx, y)) {
    x += dx;
  } else {
    if(setzero) xspd = 0;
    collides = true;
    break;
  }
}
if(!collisionAt(slf, wall, x, y+yspd)) {
  y += yspd;
}
else
for(let i = 0; i < Math.round(Math.abs(yspd)); i++) {
  const dy = Math.sign(yspd);
  if(!collisionAt(slf, wall, x, y+dy)) {
    y += dy;
  } else {
    if(setzero) yspd = 0;
    collides = true;
    break;
  }
}
});
`;

</script>
<fieldset>
    <FResource id="follow" bind:resource={followSprite} resourceType={Sprite}> follow sprite </FResource>
    <FNumber id="followSpeed" bind:value={followSpeed}> &mdash; speed </FNumber>
    <FResource id="collideWith" bind:resource={collideWith} resourceType={Sprite}> collide with sprite </FResource>
    <FNumber id="gravity" bind:value={gravity}>gravity</FNumber>
</fieldset>

