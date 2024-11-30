#version 300 es

in vec2 a_position;

uniform mat4 u_projection;

void main(void) {
    gl_Position = u_projection * vec4(a_position, 0., 1.);
}