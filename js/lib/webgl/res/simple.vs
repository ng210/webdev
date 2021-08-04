#version 300 es

uniform mat4 u_viewProjectionMat4;
uniform mat4 u_normalMat4;
uniform mat4 u_modelMat4;

in vec3 a_position;
in vec2 a_texcoord;
in vec3 a_color;
in vec3 a_normal;

out vec2 v_texcoord;
out vec3 v_color;
out vec3 v_normal;
out vec4 v_position;

void main(void) {
    v_texcoord = a_texcoord;
    v_color = a_color;
    v_normal = mat3(u_normalMat4) * a_normal;
    v_position = u_modelMat4 * vec4(a_position, 1.);
    gl_Position = u_viewProjectionMat4 * v_position;
}