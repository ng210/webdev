#version 300 es
precision highp float;

in vec4 v_texcoord;
in float v_factor;

uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform float u_factor;
uniform float u_grid;

out vec4 color;

void main() {
    vec4 pix = mix(texture(u_texture1, v_texcoord.xy), texture(u_texture2, v_texcoord.zw), u_factor);
    color = pix + u_grid * (0.1 - 0.5*vec4(v_factor, v_factor, v_factor, 1.0));
}