#version 300 es

in vec2 a_localPos; // coordinates of a unit square (6 verts -> 2 tris)

in vec4 a_objectPos; // positions, and origins of instances (x, y, ox, oy)
in vec4 a_spriteMapPos; // UV coordinates as a rectangle (x, y, w, h)
in vec4 a_objectScaleRot; // scale and rotation (sx, sy, rx, ry), rotation is a (unit) vector 
in vec4 a_color; // color, multiplicative / transparency
in vec4 a_tint; // tint, alpha drives strength of tint

uniform vec2 u_resolution; // screen resolution
uniform vec2 u_spriteMap_resolution; // sprite map resolution

out vec2 v_texcoord;
out vec4 v_color;
out vec4 v_tint;

void main() {
    // position in world space / screen space (same thing atm)
    //start unit rectangle vertex position  (0, 0) (1, 1)
    //scale by uv size                      (0, 0) (60, 60)
    vec2 adjPosition = a_localPos * a_spriteMapPos.zw * u_spriteMap_resolution;
    //move by origin                        (-30, -30) (30, 30)
    adjPosition -= a_objectPos.zw;
    //rotate                                (15, -15) (-15, 15)
    vec2 a = adjPosition;
    vec2 b = a_objectScaleRot.zw;
    adjPosition = vec2((a.x * b.x) - (a.y * b.y), (a.x * b.y) + (a.y * b.x));
    //scale                                 (-15, -15) (15, 15)
    adjPosition *= a_objectScaleRot.xy;
    // move to actual pos
    adjPosition += a_objectPos.xy;
    // todo
    gl_Position = vec4(adjPosition, 0, 1) / vec4(u_resolution, 1, 1) * 2.0 - 1.0;
    gl_Position *= vec4(1.0, -1.0, 1.0, 1.0);
    v_texcoord = a_localPos * a_spriteMapPos.zw + a_spriteMapPos.xy;

    v_color = a_color;
    v_tint = a_tint;
}