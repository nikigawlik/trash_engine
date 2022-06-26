import * as database from "./database.mjs";
import { Room } from "./room.mjs";
import { Folder } from "./folder.mjs";
import { ResourceManager } from "./resource_manager.mjs";
import * as sprite_editor from "./sprite.mjs";
import { Sprite } from "./sprite.mjs";
import * as ui from "./ui.mjs";
import * as components from "./components.mjs";

console.log("main.mjs loading")

window.onload = async () => {
    console.log("--- window.onload ---")
    // initialize different modules
    await database.init([Sprite, Room, Folder]);
    await ResourceManager.init();
    components.loadApp();
    await ui.init();
    await sprite_editor.init();
    // await SaveSystem.init();
}
