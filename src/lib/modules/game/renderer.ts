import type Sprite from "../structs/sprite";
import type { SpriteInstance } from "./game";
import type ResourceManager from "./ResourceManager";

function getShaderSource(): { vertex: string, fragment: string } {
    let vertex = `#version 300 es
        in vec2 a_localPos; // coordinates of a unit square (6 verts -> 2 tris)
        in vec4 a_objectPos; // positions, and origins of instances (x, y, ox, oy)
        in vec4 a_spriteMapPos; // UV coordinates as a rectangle (x, y, w, h)
        in vec4 a_objectScaleRot; // scale and rotation (sx, sy, rot, 0) 
        in vec4 a_color; // color tint, transparency
        
        uniform vec2 u_resolution; // screen resolution
        uniform vec2 u_spriteMap_resolution; // sprite map resolution

        out vec2 v_texcoord;
        out vec4 v_color;

        void main() {
            // position in world space / screen space (same thing atm)
            //start unit rectangle vertex position  (0, 0) (1, 1)
            //scale by uv size                      (0, 0) (60, 60)
            vec2 adjPosition = a_localPos * a_spriteMapPos.zw * u_spriteMap_resolution;
            //move by origin                        (-30, -30) (30, 30)
            adjPosition -= a_objectPos.zw;
            //scale                                 (-15, -15) (15, 15)
            adjPosition *= a_objectScaleRot.xy;
            //rotate                                (15, -15) (-15, 15)
            // move to actual pos
            adjPosition += a_objectPos.xy;
            // todo
            gl_Position = vec4(adjPosition, 0, 1) / vec4(u_resolution, 1, 1) * 2.0 - 1.0;
            gl_Position *= vec4(1.0, -1.0, 1.0, 1.0);
            v_texcoord = a_localPos * a_spriteMapPos.zw + a_spriteMapPos.xy;

            v_color = a_color;
        }
    `;
    let fragment = `#version 300 es
        precision highp float;

        in vec2 v_texcoord;
        in vec4 v_color;

        uniform sampler2D u_texture;
        
        out vec4 outColor;

        void main() {
            outColor = texture(u_texture, v_texcoord) * v_color;
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
        let spriteMapResolutionUniformLocation = gl.getUniformLocation(program, "u_spriteMap_resolution");
        
        let localPosAttributeLocation = gl.getAttribLocation(program, "a_localPos");

        let positionOriginAttribLocation = gl.getAttribLocation(program, "a_objectPos");
        let spriteCoordAttribLocation = gl.getAttribLocation(program, "a_spriteMapPos");
        let scaleRotationAttribLocation = gl.getAttribLocation(program, "a_objectScaleRot");
        let colorAttribLocation = gl.getAttribLocation(program, "a_color");
        // let textureLoc = gl.getAttribLocation(program, "u_texture");

        // buffers
        let unitSquareBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, unitSquareBuffer);
        
        // vao
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        
        // unit square
        let square = [
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(square), gl.STATIC_DRAW);

        // instance buffers
        let positionOriginBuffer = _setUpInstAttribBuffer(gl, positionOriginAttribLocation, 4, gl.FLOAT, false, 4*4, 0);
        let spriteCoordBuffer = _setUpInstAttribBuffer(gl, spriteCoordAttribLocation, 4, gl.FLOAT, false, 4*4, 0);
        let scaleRotationBuffer = _setUpInstAttribBuffer(gl, scaleRotationAttribLocation, 4, gl.FLOAT, false, 4*4, 0);
        let colorBuffer = _setUpInstAttribBuffer(gl, colorAttribLocation, 4, gl.FLOAT, false, 4*4, 0);

        // texture buffer
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spriteMap);
        gl.generateMipmap(gl.TEXTURE_2D);
        
        // do this last for some reason
        gl.bindBuffer(gl.ARRAY_BUFFER, unitSquareBuffer);
        gl.enableVertexAttribArray(localPosAttributeLocation);

        // constant uniforms

        let t = 0;
        this.renderFunc = (instances: SpriteInstance[]) => {
            t++;
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
            gl.uniform2f(spriteMapResolutionUniformLocation, spriteMap.width, spriteMap.height);
            
            gl.bindVertexArray(vao);

            // set instance props etc. stuff
            this._fillFloat4BufferInstances(gl,
                positionOriginBuffer,
                instances,
                (inst, sprite) => [inst.x, inst.y, sprite.originX, sprite.originY]
            );
            this._fillFloat4BufferInstances(gl,
                spriteCoordBuffer,
                instances,
                (inst, sprite) => {
                    const p = coords.get(sprite);
                    return [p.x, p.y, p.width, p.height]
                }
            );
            this._fillFloat4BufferInstances(gl,
                scaleRotationBuffer,
                instances,
                (inst, spr) => [
                    inst.imgScaleX, 
                    inst.imgScaleY, 
                    0.0, 
                    0.0
                ]
            );
            this._fillFloat4BufferInstances(gl,
                colorBuffer,
                instances,
                (inst, spr) => [
                    1, // (1 + Math.cos((t/100+0)*2*Math.PI))/2,
                    1, // (1 + Math.cos((t/100+0.333)*2*Math.PI))/2,
                    1, // (1 + Math.cos((t/100+0.666)*2*Math.PI))/2,
                    inst.imgAlpha
                ]
            );
            
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

    _fillFloat4BufferInstances(
        gl: WebGL2RenderingContext, 
        buffer: WebGLBuffer, 
        instances: SpriteInstance[], 
        func: (inst: SpriteInstance, sprite: Sprite) => [number, number, number, number]
    ) {
        let dataArray = new Float32Array(instances.length * 4);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, dataArray.byteLength, gl.DYNAMIC_DRAW);

        for(let i = 0; i < instances.length && i * 4 < dataArray.length; i++) {
            let inst = instances[i];
            let sprite = this.resourceManager.getResource(inst.spriteID) as Sprite;
            
            dataArray.set(func(inst, sprite), i * 4);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, dataArray);
    }

    render(instances: SpriteInstance[]) {
        this.renderFunc(instances);
    }
}

function _setUpInstAttribBuffer(gl: WebGL2RenderingContext, attribLocation: number, size: number, type: number, normalized: boolean, stride: number, offset: number) {
    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        
    gl.enableVertexAttribArray(attribLocation)
    gl.vertexAttribPointer(attribLocation, size, type, normalized, stride, offset);
    gl.vertexAttribDivisor(attribLocation, 1);  
    return buffer;
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
                // 1 px extra space
                const gap = 1;
                const r = {left: x-gap, top: y-gap, right: x+sw+gap, bottom: y+sh+gap};
                if(freeAt(r)) {
                    placed.push(r);
                    coords.set(spr, {
                        x: r.left+gap,
                        y: r.top+gap,
                        width: (r.right - r.left - gap*2),
                        height: (r.bottom - r.top - gap*2),
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