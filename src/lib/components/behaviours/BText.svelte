
<script lang="ts">
    import type Behaviour from "../../modules/structs/behaviour";
    import FColor from "./fields/FColor.svelte";
    import FNumber from "./fields/FNumber.svelte";
    import FText from "./fields/FText.svelte";
    import FToggle from "./fields/FToggle.svelte";
    
    // export let sprite: Sprite;
    export let behaviour: Behaviour;
    $: behaviour.iconID = 75;

    let text = behaviour.data.text || "hello.";
    let font = behaviour.data.font || "25px serif";
    let fillStyle = behaviour.data.fillStyle || "#eeeeee";
    let animSpeed = behaviour.data.animSpeed || 0;
    let hideSelf = !!(behaviour.data.hideSelf);

    $: behaviour.data = {
        text,
        font,
        fillStyle,
        animSpeed,
        hideSelf,
    }


    // $: if(behaviour) behaviour.props = ["text", "animSpeed"];
    $: if(behaviour) behaviour.props = ["text"];
    $: if(behaviour) behaviour.code = 
`
${hideSelf? "" : "// "}imgAlpha = 0 // hide self

let ctx = getCanvas2DContext();

let t = 0;
let animSpeed = ${animSpeed}/10;
let font = "${font}";
let fillStyle = "${fillStyle}";
text = text || \`${text}\`;

onUpdate(() => {

t += animSpeed;
if(animSpeed == 0) 
    t = 99999; // skip instantly

const lines = 
  text
  .substring(0, ~~t)
  .split("\\n")
//   .filter(x => x != "")
;

ctx.font = font;
ctx.fillStyle = fillStyle;
ctx.textAlign = "center";
ctx.textBaseline = "middle";

const m = ctx.measureText("Wg");
const lineHeight = (m.actualBoundingBoxAscent 
 + m.actualBoundingBoxDescent) * 1.5; 

let i = 0;
for(let line of lines) {
  const ty = 
    -((lines.length-1)/2) * lineHeight + 
    i * lineHeight
  ;

  ctx.fillText(line, x, y + ty);
  i++;
}

})
`

</script>

<fieldset>
    <p>
        Displays some text on top of the object.
        Set the animation speed to let the text appear slowly.
    </p>
    <hr />
    <FText id="text" bind:value={text} useTextarea> text </FText>
    <FText id="font" bind:value={font}> font </FText>
    <FColor id="color" bind:value={fillStyle}> color </FColor>
    <FNumber id="animation-speed" bind:value={animSpeed} min={0}> animation speed </FNumber>
    <FToggle id="hide-self" bind:value={hideSelf}>hide the sprite</FToggle>
</fieldset>


<style>
    p {
        max-width: 15rem;
    }
</style>