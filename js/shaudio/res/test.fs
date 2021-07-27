precision highp float;
varying vec4 v_position;

void main(void) {
    vec3 col = 1.-vec3(clamp(.5*v_position.z, 0., 1.));
    gl_FragColor = vec4(col*vec3(1., 3., 4.) , 1);
}