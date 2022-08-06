import * as database from "./database.mjs";
import { Folder } from "./folder.mjs";
import * as app from "./app.mjs";
import { ResourceManager } from "./resource_manager.mjs";
import { Room } from "./room.mjs";
import * as sprite_editor from "./sprite.mjs";
import { Sprite } from "./sprite.mjs";
import * as ui from "./ui.mjs";
import { Instance } from "./instance.mjs";

console.log("main.mjs loading")

if(typeof window !== 'undefined') {
    window.onload = async () => {
        console.log("--- window.onload ---")
        // initialize different modules
        await database.init([Sprite, Room, Folder, Instance]);
        // await ResourceManager.init();
        await app.load();
        await ui.init();
        await sprite_editor.init();
        // await SaveSystem.init();
        console.log("--- --- ---- --- ---")
        console.log("--- loading done ---")
        console.log("--- --- ---- --- ---")
        testStuff();
    }
}


function testStuff() {
    // ui.cloneFromTemplate("#objectEditorCard", document.querySelector("main"))
}

