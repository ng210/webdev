attribute vec3 a_position;
uniform mat4 u_viewProjection;
uniform mat4 u_model;

varying vec4 v_position;

void main(void) {
    v_position = u_viewProjection * u_model * vec4(a_position, 1.);
    gl_Position = v_position;
}