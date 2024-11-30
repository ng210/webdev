#version 300 es
in vec2 a_position;
out vec2 v_texcoord;

void main(void) {
    gl_Position = vec4(a_position, 0., 1.);
    v_texcoord = .5 * (a_position + 1.);
}