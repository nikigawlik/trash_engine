import BehaviourEditor from "../components/Cards/BehaviourEditor.svelte";
import GamePreview from "../components/Cards/GamePreview.svelte";
import Log from "../components/Cards/Log.svelte";
import MainPanel from "../components/Cards/MainPanel.svelte";
import Reference from "../components/Cards/Reference.svelte";
import Resources from "../components/Cards/Resources.svelte";
import RoomEditor from "../components/Cards/RoomEditor.svelte";
import Settings from "../components/Cards/Settings.svelte";
import SoundEffectEditor from "../components/Cards/SoundEffectEditor.svelte";
import SpriteEditor from "../components/Cards/SpriteEditor.svelte";

const nameDict = new WeakMap<object, string>();

nameDict.set(BehaviourEditor, "Behaviour Editor")
nameDict.set(GamePreview, "Game Preview")
nameDict.set(Reference, "Reference")
nameDict.set(Resources, "Resources")
nameDict.set(RoomEditor, "Room Editor")
nameDict.set(Settings, "Settings")
nameDict.set(SoundEffectEditor, "Sound Effect Editor")
nameDict.set(SpriteEditor, "Sprite Editor")
nameDict.set(MainPanel, "Main Panel")
nameDict.set(Log, "(Experimental) Log")
// nameDict.set(,"")

export function getDisplayName(thing: any) {
    if(nameDict.has(thing))
        return nameDict.get(thing);
    else
        return `<name-missing ${thing}>`;
}