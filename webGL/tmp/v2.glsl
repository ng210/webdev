precision highp float;
precision highp int;

uniform mat4 iModelMatrix;
uniform mat4 iNormalMatrix;
uniform mat4 iViewProjectionMatrix;

attribute vec4 aPosition;
attribute vec4 aNormal;
//attribute vec4 aColor;
//attribute vec4 aUV0;
//attribute vec4 aUV1;

varying vec4 v_wPosition;
varying vec4 v_wNormal;
varying vec3 v_color;

void main() {
	v_wPosition = iModelMatrix*aPosition;
	v_wNormal = iNormalMatrix*aNormal;
	gl_Position = iViewProjectionMatrix*v_wPosition;
	v_color = abs(normalize(aPosition.xyz));
}
