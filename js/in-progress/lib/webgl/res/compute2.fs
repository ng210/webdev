#version 300 es
precision highp float;

in vec2 v_texcoord;
uniform sampler2D u_texture;
uniform float u_offset;

out float color;

void main(void) {
    vec2 size = vec2(textureSize(u_texture, 0));
    vec2 ij = vec2(floor(size * v_texcoord));
    float ix = u_offset + ij.x + ij.y*size.x;
    color = texture(u_texture, v_texcoord).x + ix;
}