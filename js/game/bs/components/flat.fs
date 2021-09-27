#version 300 es
precision highp float;

in vec2 v_position;
//uniform sampler2D u_texture;

out vec4 color;

void main(void) {
    color = vec4(.5, .4, .2, 1.);
}