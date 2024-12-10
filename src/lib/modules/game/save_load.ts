import defaultProjectData from "../../../assets/engineAssets/default_game.json";
import { deserialize, requestAsync } from "../serialize";
import Resource from "../structs/resource";
import GameData, { gameData } from "./game_data";
import { assert } from "./utils";

import { db, getDocumentGameData, STORE_NAME_RESOURCES } from "../database";
import { asStore } from "../store_owner";

export async function loadDefaultProject() {
    await loadGameData(defaultProjectData);
}

export async function loadGameData(data: any) {
    let gd: GameData;
    try {
        let additionalProperties = new WeakMap<any, any>();
        gd = await deserialize(data, additionalProperties);

        if(gd["version"] == 4) {
            gd = transfromFromVersion4(gd);
        }

        // Do a non-comprehensive check for data validity
        try {
            assert(gd.resources instanceof Map, `.resources is ${typeof gd.resources}`)
            assert(gd.settings instanceof Object, `.settings is ${typeof gd.settings}`)
            assert(typeof gd.engineVersion === "string", `engineVersion is ${gd.engineVersion}`)
            assert(typeof gd.settings.LICENSE === "string", `settings.LICENSE is ${gd.settings.LICENSE}`)
            assert(typeof gd.settings.title === "string", `settings.title is ${gd.settings.title}`)
            for (let [key, value] of gd.resources) {
                assert(typeof key === "string", `resource ${key} key is ${typeof key}`)
                assert(value instanceof Resource, `resource ${key} value is ${typeof value}`)
            }
        } catch (e) {
            console.log(data);
            throw Error(`Could not load game data: Wrong structure: ${e.message}`)
        }

        // TODO make a backup or sth?
        // if (gd.engineVersion != version)
        //     throw Error("Could not load game data: Unsupported version")

        gameData.set(gd);
        console.log("- game data loaded")

    } catch (e) {
        console.log(`Loading game data failed: ${e.message}`)
        console.error(e)
        gameData.set(gd = new GameData())
    }
}

function transfromFromVersion4(data: any) {
    assert(data.version == 4)
    assert(data.resources instanceof Array, "v4: resources not array")
    assert(data.settings instanceof Object, "v4: settings not object")

    let gd = new GameData();
    let resArr = data.resources as Resource[];
    let rmap = new Map(resArr.map(r => [r.uuid, r]))
    asStore(gd.resources, "gameData.resources").set(rmap);
    asStore(gd.settings, "gameData.settings").set(data.settings);

    return gd;
}

export async function autoLoadGameData() {
    // first check the document data (in exported games)
    let docData = getDocumentGameData();
    if (docData != null) {
        console.log("- load from document data")
        await loadGameData(JSON.parse(docData));
        return;
    }

    // now try to load from indexeddb
    if ((!db || !db.transaction)) {
        console.log("! no database support & no inline data")
        await loadDefaultProject();
        return;
    }

    let trans = db.transaction(STORE_NAME_RESOURCES, "readonly");
    let objectStore = trans.objectStore(STORE_NAME_RESOURCES);
    let rnum = await requestAsync(objectStore.count());

    if (rnum == 0) {
        console.log("! resources object store is empty")
        await loadDefaultProject();
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
