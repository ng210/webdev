#version 300 es
precision highp float;

in vec4 v_position;
uniform sampler2D u_texture;

out float color;

void main(void) {
    color = v_position.x;//texture(u_texture, v_position.xy).x;
}