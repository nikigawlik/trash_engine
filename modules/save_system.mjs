import { resourceManager } from "./resource_manager.mjs";


let gameData = {};
window.gameData = gameData;

let backu;

export class SaveSystem {
    static init() {
        gameData.resourceManager = resourceManager;
    }
}

function replacer(key, value) {
    // Filtering out properties
    if (typeof key === 'string' && value != "" && key[0] == "_") {
      return undefined;
    }
    return value;
}

window.testSave = () => {
    console.log(gameData);
    let json = JSON.stringify(gameData, replacer);
    console.log(json)
    let encoder = new TextEncoder('UTF-8');
    let bytes = encoder.encode(json);
    let newlen = Math.ceil(bytes.length / 3) * 4;
    let newbytes = new Uint8Array(newlen);
    console.log(`bytes: ${bytes.length} >>> ${newbytes.length}`);
    for(let i = 0; i < newbytes.length; i++) {
        if(i%4 == 3) 
            newbytes[i] = 255;
        else
            newbytes[i] = bytes[i - ~~(i/4)];
    }
    // backu = newbytes;
    let wid = Math.ceil((newbytes.length / 4)**0.5);
    let canvas = document.createElement("canvas");
    canvas.width = canvas.height = wid;
    let ctx = canvas.getContext("2d");
    let imgDat = ctx.getImageData(0, 0, wid, wid);
    imgDat.data.set(newbytes);
    ctx.putImageData(imgDat, 0, 0);
    // imgDat = ctx.getImageData(0, 0, wid, wid);
    // backu = imgDat.data;
    document.querySelector("main").append(canvas);
};

window.testLoad = () => {
    /** @type {HTMLCanvasElement} */ let canvas = document.querySelector("main>canvas");
    let ctx = canvas.getContext("2d");
    let imgDat = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let bytes = imgDat.data;
    let newlen = ~~(bytes.length/4) * 3; // bytes.length is always divisible by 4
    let newbytes = new Uint8Array(newlen);
    for(let i = 0; i < newbytes.length; i++) {
        newbytes[i] = bytes[~~(i * 4 / 3)];
    }

    // trim trailing null/0 bytes
    let datalen = newbytes.indexOf(0);
    if(datalen < 0) datalen = newbytes.length;
    let oldlen = newbytes.length;
    newbytes = newbytes.slice(0, datalen);

    console.log(`bytes: ${bytes.length} >>> ${oldlen} >>> ${newbytes.length}`);
    
    let decoder = new TextDecoder('UTF-8');
    let json = decoder.decode(newbytes);
    console.log(json);
    let data = JSON.parse(json);
    console.log(data);
}



window.testCanvas = () => {
    let c = (resourceManager.root.contents[0].contents[0]);
    console.log(c);
    document.querySelector("main").append(c.canvas);
}