import defaultProjectData from "../../../assets/engineAssets/default_game.json";
import { deserialize, requestAsync } from "../serialize";
import Resource from "../structs/resource";
import GameData, { gameData } from "./game_data";
import { assert } from "./utils";

import { version } from "../../../../package.json";
import { db, getDocumentGameData, STORE_NAME_RESOURCES } from "../database";

export async function loadDefaultProject() {
    await loadGameData(defaultProjectData);
}

export async function loadGameData(data: any) {
    try {
        let additionalProperties = new WeakMap<any, any>();
        let gd: GameData = await deserialize(data, additionalProperties);

        // Do a non-comprehensive check for data validity
        try {
            assert(gd.resources instanceof Map)
            assert(gd.settings instanceof Object)
            assert(typeof gd.engineVersion === "string")
            assert(typeof gd.settings.LICENSE === "string")
            assert(typeof gd.settings.title === "string")
            for (let [key, value] of gd.resources) {
                assert(typeof key === "string")
                assert(value instanceof Resource)
            }
        } catch (e) {
            console.log(data);
            throw Error("Could not load game data: Wrong structure")
        }

        if (gd.engineVersion != version)
            throw Error("Could not load game data: Unsupported version")

        gameData.set(gd);
        console.log("- game data loaded")

    } catch (e) {
        console.log(`Loading game data failed: ${e.message}`)
        console.error(e)
        gameData.set(new GameData())
    }
}


export async function autoLoadGameData() {
    // first check the document data (in exported games)
    let docData = getDocumentGameData();
    if (docData != null) {
        console.log("- load from document data")
        loadGameData(JSON.parse(docData));
        return;
    }

    // now try to load from indexeddb
    if ((!db || !db.transaction)) {
        console.log("! no database support & no inline data")
        return;
    }

    let trans = db.transaction(STORE_NAME_RESOURCES, "readonly");
    let objectStore = trans.objectStore(STORE_NAME_RESOURCES);
    let rnum = await requestAsync(objectStore.count());

    if (rnum == 0) {
        console.log("! resources object store is empty")
        return;
    }

    console.log("- load from resources store")
    let settings = await requestAsync(objectStore.get(".settings"));
    let engineVersion = await requestAsync(objectStore.get(".engineVersion"));
    let resourceObjs = await requestAsync(objectStore.getAll(IDBKeyRange.lowerBound("0", true))); // hacky way to filter our ".asdfasd" type keys 
    let resources = { _type: "Map" }
    for (let r of resourceObjs) {
        if (r.uuid) resources[r.uuid] = r;
    }

    await loadGameData({
        _type: "GameData",
        settings, engineVersion, resources
    });
    return;
}
