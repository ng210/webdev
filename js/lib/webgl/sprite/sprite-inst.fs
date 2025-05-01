#version 300 es
precision mediump float;

out vec4 fragColor;

in vec2 v_texcoord;
in vec4 v_color;
uniform sampler2D u_texture;
 
void main() {
    fragColor = v_color;    // * texture(u_texture, v_texcoord);
}