#extension GL_OES_standard_derivatives : enable

precision mediump float;

varying vec2 v_texCoord;
varying vec4 v_wposition;
varying float v_height;
varying float distFromCam;

uniform vec3 lightDir;
uniform vec3 skyColor;

vec3 normal(in vec3 varPos) {
	return normalize(cross(dFdx(varPos), dFdy(varPos)));
}

vec3 getColor(in vec3 pos, in vec3 norm) {
	vec3 terrain = vec3(0.41, 0.8, 0.42);
	vec3 ocean = vec3(0.2, 0.26, 0.5);
	float n = normalize(abs(norm)).y;
	vec3 c = vec3(terrain);
	if (v_height < 0.0) c = vec3(ocean)*(4.0 + v_height/4.0)/2.0;
	return c;
}

void main() {
	vec4 transNormal = vec4(normal(v_wposition.xyz), 1);
	float v_Dot = max(dot(transNormal.xyz, lightDir), 0.0);
	//vec2 texCoord = vec2(v_texCoord.s, v_texCoord.t);
	//vec4 color = texture2D(heightMap, texCoord);
	vec3 color = getColor(v_wposition.xyz, transNormal.xyz);
	vec3 c = mix(color * v_Dot * length(skyColor), skyColor, distFromCam);
	gl_FragColor = vec4(c, 1.0);
}
