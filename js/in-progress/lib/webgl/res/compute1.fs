#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D u_texture;
uniform float u_time;

out float color;

void main(void) {
    color = 2.*texture(u_texture, v_texcoord).x;
}