#extension GL_OES_standard_derivatives : enable

precision highp float;
precision highp int;

uniform vec3 iLightDir;

varying vec4 v_wPosition;
//varying vec4 v_wNormal;
varying vec3 v_color;

vec3 normal(in vec3 varPos) {
	return normalize(cross(dFdx(varPos), dFdy(varPos)));
}

void main() {
	float v_Dot = max(dot(normal(v_wPosition.xyz), iLightDir), 0.0);
	gl_FragColor = vec4(v_color*v_Dot, 1.0);
}
