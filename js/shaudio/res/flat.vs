#version 300 es
in vec2 a_position;
out vec4 v_position;

void main(void) {
    v_position = vec4(a_position, 0., 1.);
    gl_Position = v_position;
    v_position = .5 * (v_position + vec4(1.));
}