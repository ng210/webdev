#extension GL_OES_standard_derivatives : enable

precision highp float;
precision highp int;

// common uniforms
uniform int iModelId;
uniform vec2 iMousePos;
uniform vec2 iResolution;

uniform vec3 iSkyColor;
uniform vec3 iLightDir;
uniform float iSize;

// common varyings

varying vec4 v_wposition;
varying vec4 v_wNormal;
varying vec3 v_color;

void main() {
	float v_Dot = max(dot(normalize(v_wNormal.xyz), iLightDir), 0.0);
		gl_FragColor = vec4(v_color*v_Dot, 1.0);
}
