import type Sprite from "../structs/sprite";
import type { SpriteInstance } from "./game";
import type ResourceManager from "./ResourceManager";

function getShaderSource(): { vertex: string, fragment: string } {
    let vertex = `#version 300 es
        in vec2 a_localPos;
        in vec4 a_objectPos;
        
        uniform vec2 u_resolution;

        void main() {
            vec2 adjPosition = a_localPos * a_objectPos.zw + a_objectPos.xy;
            // adjPosition = vec2(a_localPos) * 60.0;
            gl_Position = vec4(adjPosition, 0, 1) / vec4(u_resolution, 1, 1) * 2.0 - 1.0;
            gl_Position *= vec4(1.0, -1.0, 1.0, 1.0); 
            // gl_Position = vec4(a_objectPos);
            // gl_Position = vec4(a_localPos) * vec4(1., -1., 1., 1.);
        }
    `;
    let fragment = `#version 300 es
        precision highp float;

        out vec4 outColor;

        void main() {
            outColor = vec4(1, .2, .8, 1);
        }
    `;

    return { vertex, fragment };
}

export default class Renderer {
    backgroundColor: number
    renderFunc: (instances: SpriteInstance[]) => void
    resourceManager: ResourceManager

    constructor(canvas: HTMLCanvasElement, resourceManager: ResourceManager) {
        this.backgroundColor = 0;
        this.resourceManager = resourceManager;

        let gl = canvas.getContext("webgl2");
        if (!gl) throw Error("No webgl!");

        // program setup
        let {fragment, vertex} = getShaderSource();
        let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertex);
        let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragment);
        let program = createProgram(gl, vertexShader, fragmentShader);

        // locations
        let resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
        
        let objectPosAttributeLocation = gl.getAttribLocation(program, "a_objectPos");
        let localPosAttributeLocation = gl.getAttribLocation(program, "a_localPos");

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

        let instNum = 16;
        let instanceData = new Float32Array(4 * instNum);
        let positionsBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
        // just allocate the buffer
        gl.bufferData(gl.ARRAY_BUFFER, instanceData.byteLength, gl.DYNAMIC_DRAW);
    
        
            
        gl.enableVertexAttribArray(objectPosAttributeLocation)
        gl.vertexAttribPointer(objectPosAttributeLocation, 4, gl.FLOAT, false, 4*4, 0);
        gl.vertexAttribDivisor(objectPosAttributeLocation, 1);    
        
        gl.bindBuffer(gl.ARRAY_BUFFER, unitSquareBuffer);
        gl.enableVertexAttribArray(localPosAttributeLocation);

        this.renderFunc = (instances: SpriteInstance[]) => {

            gl.bindBuffer(gl.ARRAY_BUFFER, unitSquareBuffer);

            let size = 2;          // 2 components per iteration
            let type = gl.FLOAT;   // the data is 32bit floats
            let normalize = false; // don't normalize the data
            gl.vertexAttribPointer(localPosAttributeLocation, size, type, normalize, 0, 0)

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.useProgram(program);
            gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
            
            gl.bindVertexArray(vao);

            instanceData = new Float32Array(instances.length * 4);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
            // just allocate the buffer
            gl.bufferData(gl.ARRAY_BUFFER, instanceData.byteLength, gl.DYNAMIC_DRAW);

            for(let i = 0; i < instances.length && i * 4 < instanceData.length; i++) {
                let inst = instances[i];
                let sprite = resourceManager.getResource(inst.spriteID) as Sprite;
                
                instanceData[i * 4 + 0] = inst.x - sprite.originX;
                instanceData[i * 4 + 1] = inst.y - sprite.originY;
                instanceData[i * 4 + 2] = sprite.canvas.width;
                instanceData[i * 4 + 3] = sprite.canvas.height;   

                // console.log('here')
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, positionsBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceData);
            
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

function makeSpriteMap() {
    
}