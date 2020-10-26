attribute vec4 a_position;
attribute vec4 a_texcoord;
attribute float a_factor;
varying vec4 v_texcoord;
varying float v_factor;

void main() {
    gl_Position = a_position;
    v_texcoord = a_texcoord;    //0.5*vec2(a_position.x + 1.0, 1.0 - a_position.y);
    v_factor = a_factor;
}
