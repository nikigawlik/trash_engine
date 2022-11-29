import type Sprite from "../structs/sprite";
import type { SpriteInstance } from "./game";
import type ResourceManager from "./ResourceManager";

function getShaderSource(): { vertex: string, fragment: string } {
    let vertex = `#version 300 es
        in vec2 a_localPos;
        in vec4 a_objectPos;
        in vec4 a_spriteMapPos;
        
        uniform vec2 u_resolution;

        out vec2 v_texcoord;

        void main() {
            vec2 adjPosition = a_localPos * a_objectPos.zw + a_objectPos.xy;
            gl_Position = vec4(adjPosition, 0, 1) / vec4(u_resolution, 1, 1) * 2.0 - 1.0;
            gl_Position *= vec4(1.0, -1.0, 1.0, 1.0);
            v_texcoord = a_localPos * a_spriteMapPos.zw + a_spriteMapPos.xy;
        }
    `;
    let fragment = `#version 300 es
        precision highp float;

        in vec2 v_texcoord;

        uniform sampler2D u_texture;
        
        out vec4 outColor;

        void main() {
            outColor = texture(u_texture, v_texcoord);
        }
    `;

    return { vertex, fragment };
}

export default class Renderer {
    renderFunc: (instances: SpriteInstance[]) => void
    resourceManager: ResourceManager

    constructor(canvas: HTMLCanvasElement, resourceManager: ResourceManager) {
        this.resourceManager = resourceManager;

        let gl = canvas.getContext("webgl2");
        if (!gl) throw Error("No webgl!");

        // prep work
        let {canvas: spriteMap, coords} = makeSpriteMap(resourceManager.getSprites());

        // program setup
        let {fragment, vertex} = getShaderSource();
        let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
        let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);
        let program = createProgram(gl, vertexShader, fragmentShader);

        // settings
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // locations
        let resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
        let textureUniformLocation = gl.getUniformLocation(program, "u_texture");
        
        let objectPosAttributeLocation = gl.getAttribLocation(program, "a_objectPos");
        let localPosAttributeLocation = gl.getAttribLocation(program, "a_localPos");
        let spriteMapPosAttributeLocation = gl.getAttribLocation(program, "a_spriteMapPos");

        // buffers
        let unitSquareBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitSquareBuffer);
        
        // vao
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        
        // three 2d points
        let square = [
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square), gl.STATIC_DRAW);

        // set up the instance position+size buffer
        let positionsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
            
        gl.enableVertexAttribArray(objectPosAttributeLocation)
        gl.vertexAttribPointer(objectPosAttributeLocation, 4, gl.FLOAT, false, 4*4, 0);
        gl.vertexAttribDivisor(objectPosAttributeLocation, 1);  

        // set up the instance sprite coords buffer
        let spriteCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, spriteCoordBuffer);

        gl.enableVertexAttribArray(spriteMapPosAttributeLocation)
        gl.vertexAttribPointer(spriteMapPosAttributeLocation, 4, gl.FLOAT, false, 4*4, 0);
        gl.vertexAttribDivisor(spriteMapPosAttributeLocation, 1);

        // texture buffer
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spriteMap);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        // do this last for some reason
        gl.bindBuffer(gl.ARRAY_BUFFER, unitSquareBuffer);
        gl.enableVertexAttribArray(localPosAttributeLocation);

        // constant uniforms

        this.renderFunc = (instances: SpriteInstance[]) => {
            // set up verts / unit square
            gl.bindBuffer(gl.ARRAY_BUFFER, unitSquareBuffer);

            let size = 2;          // 2 components per iteration
            let type = gl.FLOAT;   // the data is 32bit floats
            let normalize = false; // don't normalize the data
            gl.vertexAttribPointer(localPosAttributeLocation, size, type, normalize, 0, 0)

            // viewport, clear, etc.
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.useProgram(program);
            
            // set uniforms
            gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
            
            gl.bindVertexArray(vao);

            // put instance positions, uvs
            let instancePositions = new Float32Array(instances.length * 4);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, instancePositions.byteLength, gl.DYNAMIC_DRAW);
            

            let instanceUVCoords = new Float32Array(instances.length * 4);
            gl.bindBuffer(gl.ARRAY_BUFFER, spriteCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, instanceUVCoords.byteLength, gl.DYNAMIC_DRAW);

            for(let i = 0; i < instances.length && i * 4 < instancePositions.length; i++) {
                let inst = instances[i];
                let sprite = resourceManager.getResource(inst.spriteID) as Sprite;
                
                instancePositions[i * 4 + 0] = inst.x - sprite.originX;
                instancePositions[i * 4 + 1] = inst.y - sprite.originY;
                instancePositions[i * 4 + 2] = sprite.canvas.width;
                instancePositions[i * 4 + 3] = sprite.canvas.height;

                let p = coords.get(sprite);
                instanceUVCoords[i * 4 + 0] = p.x;
                instanceUVCoords[i * 4 + 1] = p.y;
                instanceUVCoords[i * 4 + 2] = p.width;
                instanceUVCoords[i * 4 + 3] = p.height;

                // console.log('here')
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, instancePositions);

            gl.bindBuffer(gl.ARRAY_BUFFER, spriteCoordBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceUVCoords);
            
            gl.drawArraysInstanced(
                gl.TRIANGLES,
                0,             // offset
                6,   // num vertices per instance
                instances.length,  // num instances
            );

            // let primitiveType = gl.TRIANGLES;
            // let offset = 0;
            // let count = 6;
            // gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

    render(instances: SpriteInstance[]) {
        this.renderFunc(instances);
    }
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    let shader = gl.createShader(type);
    if(!shader) throw Error("Failed to create shader!!")
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw Error("Shader did not compile!!");
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    let program = gl.createProgram();
    if(!program) throw Error("Could not create gl program!!");
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    if(!program) throw Error("Could not link shaders!!");
}

interface BBox {
    left: number,
    top: number,
    right: number,
    bottom: number,
}

interface Rect {
    x: number,
    y: number,
    width: number,
    height: number,
}

function makeSpriteMap(sprites: Sprite[]): {canvas: HTMLCanvasElement, coords: WeakMap<Sprite, Rect>} {
    console.log("-- generate sprite atlas --");
    let coords = new WeakMap<Sprite, Rect>();
    let area = (spr: Sprite) => (spr.canvas.width * spr.canvas.height);
    // let maxd = (spr: Sprite) => Math.max(spr.canvas.width, spr.canvas.height);
    // sprites.sort((a, b) => maxd(b) - maxd(a));
    sprites.sort((a, b) => area(b) - area(a));

    let totalPixels = sprites.map(area).reduce((a, b) => a+b);
    totalPixels *= 1.3; // insurance
    let minPower = Math.ceil(Math.log2(totalPixels**0.5));
    console.log(`sprite min size: ${2**minPower}`);

    let placed: BBox[] = [];
    let intersect = (box1: BBox, box2: BBox) => 
        box1.left < box2.right && box1.right > box2.left &&
        box1.bottom > box2.top && box1.top < box2.bottom
    ;
    let freeAt = (box: BBox) => {
        for(let other of placed) {
            if(intersect(box, other)) return false;
        }
        return true;
    }

    let w: number, h: number;

    outer: for(let i = 0; i < 3; i++) {
        w = 2**(minPower + i);
        h = 2**(minPower + i);
        placed = [];

        for(let spr of sprites) {
            let sw = spr.canvas.width;
            let sh = spr.canvas.height
            let searching = true;
            for(let y = 0; y <= h-sh && searching; y++) 
            for(let x = 0; x <= w-sw && searching; x++) {
                const r = {left: x, top: y, right: x+sw, bottom: y+sh};
                if(freeAt(r)) {
                    placed.push(r);
                    coords.set(spr, {
                        x: r.left,
                        y: r.top,
                        width: (r.right - r.left),
                        height: (r.bottom - r.top),
                    });
                    searching = false;
                    console.log(`placed ${spr.name} at ${r.left} ${r.top}`);
                }
            }
            if(searching) continue outer;
        }
        break;
    }

    console.log(`final map size: ${w} x ${h}`);

    let canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    let ctx = canvas.getContext("2d");
    for(let spr of sprites) {
        let p = coords.get(spr);
        if(!p) throw Error("sprite was not placed!!!")

        ctx.drawImage(spr.canvas, p.x, p.y); 

        // now we can normalize the uv coords
        p.x /= w;
        p.y /= h;
        p.width /= w;
        p.height /= h;
    }

    return {
        canvas,
        coords,
    }
}