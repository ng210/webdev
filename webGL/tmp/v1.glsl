#extension OES_standard_derivatives : enable

precision highp float;
precision highp int;

// common uniforms
uniform int iModelId;
uniform vec2 iResolution;
uniform float iViewDistance;

//uniform vec2 iMousePos;
uniform vec3 iCameraPos;
uniform float iSize;

uniform mat4 iModelMatrix;
uniform mat4 iViewProjectionMatrix;

uniform sampler2D heightMap;

attribute vec4 aPosition;
attribute vec4 aUV0;

// common varyings
varying vec3 v_cameraPos;

varying float v_distFromCam;
varying vec2 v_texCoord;
varying vec4 v_wposition;
varying vec3 v_wnormal;
varying float v_height;

vec3 normal2(vec2 tex) {
	float st = 1.0/iSize;
	float h0 = texture2DLod(heightMap, tex, 0.0).x;
	float h1 = h0; tex.x = aUV0.x; tex.y = aUV0.y - st;
	if (tex.y >= 0.0) h1 = texture2DLod(heightMap, tex, 0.0).x;
	float h2 = h0; tex.x = aUV0.x - st; tex.y = aUV0.y;
	if (tex.x >= 0.0) h2 = texture2DLod(heightMap, tex, 0.0).x;
	float h3 = h0; tex.x = aUV0.x; tex.y = aUV0.y + st;
	if (tex.y <= 1.0) h3 = texture2DLod(heightMap, tex, 0.0).x;
	float h4 = h0; tex.x = aUV0.x + st; tex.y = aUV0.y;
	if (tex.x <= 1.0) h4 = texture2DLod(heightMap, tex, 0.0).x;
	vec3 v1 = vec3(0.0, h1-h0, -1.0);
	vec3 v2 = vec3(-1.0, h2-h0, 0.0);
	vec3 v3 = vec3(0.0, h3-h0, 1.0);
	vec3 v4 = vec3(1.0, h4-h0, 0.0);
	return cross(v1, v2) + cross(v2, v3) + cross(v3, v4) + cross(v4, v1);
}

vec3 normal(vec2 tex) {
	float st = 1.0/iSize;
	vec2 tx = vec2(tex.x, tex.y);
	float h0 = texture2DLod(heightMap, tx, 0.0).x;
	float h1 = h0; tx.y -= st;
	if (tx.y >= 0.0) h1 = texture2DLod(heightMap, tx, 0.0).x;
	float h2 = h0; tx.x -= st; tx.y = tex.y;
	if (tx.x >= 0.0) h2 = texture2DLod(heightMap, tx, 0.0).x;
	float h3 = h0; tx.x = tex.x; tx.y += st;
	if (tx.y <= 1.0) h3 = texture2DLod(heightMap, tx, 0.0).x;
	float h4 = h0; tx.x += st; tx.y = tex.y;
	if (tx.x <= 1.0) h4 = texture2DLod(heightMap, tx, 0.0).x;
	vec3 v1 = vec3(0.0, h1-h0, -1.0);
	vec3 v2 = vec3(-1.0, h2-h0, 0.0);
	vec3 v3 = vec3(0.0, h3-h0, 1.0);
	vec3 v4 = vec3(1.0, h4-h0, 0.0);
	return cross(v1, v2) + cross(v2, v3) + cross(v3, v4) + cross(v4, v1);
}

void main() {
	vec4 pos = aPosition;
	vec2 tex = aUV0.xy;
	v_texCoord = tex;
	if (iModelId == 0) {
			v_wposition = iModelMatrix*pos;
			v_wnormal = normalize(pos.xyz);
	} else {
		v_wnormal = normal(tex);
		v_height = texture2DLod(heightMap, tex, 0.0).x;
		pos.y = v_height;
		v_wposition = iModelMatrix*pos;
		v_distFromCam = clamp(abs(distance(iCameraPos, v_wposition.xyz)), 0.0, iViewDistance)/iViewDistance;
	}
	gl_Position = iViewProjectionMatrix*v_wposition;
	v_cameraPos = iCameraPos;
}
