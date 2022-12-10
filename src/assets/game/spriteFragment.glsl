#version 300 es
precision highp float;

in vec2 v_texcoord;
in vec4 v_color;
in vec4 v_tint;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
    // multiply color
    outColor = texture(u_texture, v_texcoord) * v_color;
    // lerp to tint color
    float a = v_tint.a;
    // outColor = vec4(outColor.rgb * (1.0 - a) + v_tint.rgb * a, outColor.a);
    outColor.rgb = outColor.rgb * (1.0 - a) + v_tint.rgb * a;
    // outColor = v_tint;
}