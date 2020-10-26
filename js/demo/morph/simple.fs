precision mediump float;
varying vec4 v_texcoord;
uniform sampler2D u_texture1;
uniform sampler2D u_texture2;
uniform float u_factor;
uniform float u_grid;
varying float v_factor;


void main() {
    vec4 pix = mix(texture2D(u_texture1, v_texcoord.xy), texture2D(u_texture2, v_texcoord.zw), u_factor);
    gl_FragColor = pix + u_grid * (0.1 - 0.5*vec4(v_factor, v_factor, v_factor, 1.0));
}