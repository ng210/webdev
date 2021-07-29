#version 300 es
precision highp float;

in vec4 v_position;
out vec4 fragColor;

void main(void) {
    vec3 col = 1.-vec3(clamp(.5*v_position.z, 0., 1.));
    fragColor = vec4(col*vec3(1., 3., 4.), 1);
}