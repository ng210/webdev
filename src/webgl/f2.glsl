precision lowp float;

varying vec4 vPos;
varying vec3 vNormal;
varying vec3 vLightDir;

uniform vec2 uScreenSize;
uniform float uDTime;
uniform vec4 uGlobalColor;

void main() {
    float f = 1.05*dot(vNormal, vLightDir);
    float fp = pow(f, 51.24);
    float ff = 0.5*pow(f, 1.32); //smoothstep(0.01, 0.4, 2.0*f);
    gl_FragColor = clamp(uGlobalColor * (fp + ff), 0.0, 1.0);
    //gl_FragColor = uGlobalColor * amp;
}