precision mediump float;

varying vec2 v_texcoord;
varying float v_alpha;
uniform sampler2D u_texture;
 
void main() {
    gl_FragColor = texture2D(u_texture, v_texcoord);
    gl_FragColor.a *= v_alpha;
}