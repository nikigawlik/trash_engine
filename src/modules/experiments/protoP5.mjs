import { loadObject, createObject, updateObject, step } from "./resource_loader.mjs";
import { settings } from "./settings.mjs";

let p5Instance;
let images = [];


function p5hook() {
    const s = p => {
        p.setup = function() {
            init();
        };
        
        p.draw = function() {
            step();
        };
    };
    new p5();
    p5Instance = new p5(s, document.querySelector(".game"));
}

async function init() {
    await loadObject("obj_player");
    await loadImages();

    resizeCanvas();
    clearBackground();
    noSmooth();    

    for(let i = 0; i < 20; i++) {
        let p = createObject("obj_player");
        p.x = 150;
        p.y = 150;
    }
}

function drawTile(x, y, id, xscale = 1, yscale = 1) {
    let img = images[id];   
    x = ~~x;
    y = ~~y;
    tint(100, 100, 100);
    image(img.baseImage, x, y, img.width * xscale, img.height * yscale, img.srcX, img.srcY, img.width, img.height);
}

window.drawTile = drawTile;

function loadImageAsync(filename) {
    return new Promise(cb => p5Instance.loadImage(`game/images/${filename}`, cb));
}

async function loadImages() {
    images = [];
    for(let imageSettings of settings.images) {
        let img = await loadImageAsync(imageSettings.filename);
        if(imageSettings.slice) {
            let tileW = img.width / imageSettings.slice.columns;
            let tileH = img.height / imageSettings.slice.rows;
            let id = 0;
            for(let yy = 0; yy < imageSettings.slice.rows; yy++)
            for(let xx = 0; xx < imageSettings.slice.columns; xx++) {
                images.push({
                    name: `${imageSettings.name}_${id}`,
                    baseImage: img,
                    srcX: xx * tileW,
                    srcY: yy * tileH,
                    width: tileW,
                    height: tileH,
                });
                id++;
            }
        } else {
            images.push({
                baseImage: img,
                srcX: 0,
                srcY: 0,
                width: img.width,
                height: img.height,
            });
        }
    }

    console.log(images);
}

function clearBackground() {
    fill(settings.canvas.color);
    strokeWeight(0)
    rect(0, 0, width, height)
    strokeWeight(1)

    // let hello = [0, 0, 0, 1, 0, .5, 1, .5, 1, 0, 1, 1, 3, 1, 2, 1, 2, 0, 3, 0, 2, 0, 2, .5, 4, .5, 4, 0, 4, 1, 7, 1, 7, 0, 6, 0, 6, 1];
    // hello = hello.map(x => (x * 32) + 100);
    // for(let i = 0; i < hello.length - 2; i += 2) {
    //     p5Instance.line(
    //         hello[i], hello[i+1], hello[i+2], hello[i+3]);
    // }

    let d = -1;
    p5Instance.line(d, d, width - d, d);
    p5Instance.line(width - d, d, width - d, height - d);
    p5Instance.line(width - d, height - d, d, height - d);
    p5Instance.line(d, height - d, d, d);
}
window.clearBackground = clearBackground;

// window.sdjflkas = asdfklaksdf;
window.onload = p5hook;