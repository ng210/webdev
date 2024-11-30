#version 300 es
in vec2 a_position;
in vec4 a_texcoord;
in float a_factor;

out vec4 v_texcoord;
out float v_factor;

void main() {
    gl_Position = vec4(a_position, 0., 1.);
    v_texcoord = a_texcoord;    //0.5*vec2(a_position.x + 1.0, 1.0 - a_position.y);
    v_factor = a_factor;
}
