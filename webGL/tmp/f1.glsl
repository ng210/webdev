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
varying vec3 v_cameraPos;

varying float v_distFromCam;
varying vec2 v_texCoord;
varying vec4 v_wposition;
varying vec3 v_wnormal;
varying float v_height;

uniform sampler2D heightMap;

vec3 normal(in vec3 varPos) {
	return normalize(cross(dFdx(varPos), dFdy(varPos)));
}

vec3 getColor(in vec3 pos, in vec3 norm) {
	vec3 terrain = vec3(0.41, 0.8, 0.42);
	vec3 ocean = vec3(0.2, 0.26, 0.5);
	float n = normalize(abs(norm)).y;
	vec3 c = terrain;
	//if (v_height < -0.52) c = vec3(ocean)*(4.0 + v_height/4.0)/2.0;
	return c;
}

void main() {
	vec2 mouse = iMousePos/iResolution;
	vec2 uv = vec2(gl_FragCoord.x/iResolution.x, 1.0-gl_FragCoord.y/iResolution.y);
	vec3 transNormal = normalize(v_wnormal);
	//vec3 transNormal = normal(v_wposition.xyz);
	float mouseZ = 0.0;
	float alpha = .0;
	if (uv == mouse) mouseZ = clamp(gl_FragCoord.z, .0, iSize);
	float v_Dot = max(dot(transNormal.xyz, iLightDir), 0.0);
	vec3 color;
	if (iModelId == 0) {
		//color = vec3(iSkyColor*(.8 + .2*texture2D(heightMap, v_texCoord).x/iSize*8.0)*(.5+.5*v_Dot));
		//float c = texture2D(heightMap, v_texCoord).x;
		//color.xyz = vec3(c)/iSize*8.0;
		//color.x *= v_distFromCam;
		color = vec3(iSkyColor*(0.6+0.4*v_Dot));
		alpha = 1.0;
	} else {
		//transNormal *= 0.8 + 0.2*(clamp(fract(v_wposition.x), 0.0, 1.0)+clamp(fract(v_wposition.z), 0.0, 1.0));
		transNormal *= 0.8 + 0.1*(step(.5, fract(v_wposition.x)) + step(.5, fract(v_wposition.z)));
		float v_Dot = max(dot(transNormal.xyz, iLightDir), 0.0);
		color = getColor(v_wposition.xyz, transNormal.xyz);
		//color = mix(color * iSkyColor * v_Dot, iSkyColor, v_distFromCam);
		color *= iSkyColor * v_Dot;
		alpha = 1.0;

	}
	//alpha = clamp(2.0*(1.0-v_distFromCam), 0.0, 1.0);
	//color.x = v_distFromCam;

	// minimap
	if (gl_FragCoord.x < 256.0 && gl_FragCoord.y < 256.0) {
		vec3 v = v_cameraPos + 256.0/2.0;
		if (distance(gl_FragCoord.y, 256.0 - clamp(v.z, .0, 256.0)) < 2.0 &&
			distance(gl_FragCoord.x, clamp(v.x, .0, 256.0)) < 2.0) {
			color.xyz = vec3(1.0, .5, .5);
		}
		vec2 tex = gl_FragCoord.xy/255.0;
		float mm = texture2D(heightMap, tex).x*8.0/iSize;
		color.xyz = mix(color.xyz, vec3(mm, mm, mm), .8);
	}

	gl_FragColor = vec4(color, alpha);
}
