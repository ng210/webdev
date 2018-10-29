precision lowp float;

uniform sampler2D uTexture0;

varying vec3 vNormal;
varying vec4 vPos;
varying vec3 vLightDir1;
varying vec3 vLightDir2;
varying vec3 vLightDir3;
varying vec2 vTex0;

uniform vec4 uLightColor1;
uniform vec4 uLightColor2;
uniform vec4 uLightColor3;
uniform vec4 uAmbientColor;

uniform vec4 uGlobalColor;

void main() {
	vec3 directDir = vec3(1.0, -1.0, 1.0);
	vec4 diffuseColor = vec4(1.0, 0.98, 0.95, 1.0);
	vec4 direct = diffuseColor * dot(vNormal, normalize(directDir));
	vec4 diffuse = uLightColor1 * 1.2 * pow(max(0.0, dot(vNormal, vLightDir1)), 2.0);
	diffuse += uLightColor2 * 1.2 * pow(max(0.0, dot(vNormal, vLightDir2)), 2.0);
	diffuse += uLightColor3 * 1.2 * pow(max(0.0, dot(vNormal, vLightDir3)), 2.0);
	vec3 reflection = reflect(vLightDir1, vNormal);
	vec4 specular = uLightColor1 * pow(clamp(dot(normalize(vPos.xyz), reflection), 0.0, 1.0), 90.0);
	reflection = reflect(vLightDir2, vNormal);
	specular += uLightColor2 * pow(clamp(dot(normalize(vPos.xyz), reflection), 0.0, 1.0), 90.0);
	reflection = reflect(vLightDir3, vNormal);
	specular += uLightColor3 * pow(clamp(dot(normalize(vPos.xyz), reflection), 0.0, 1.0), 90.0);
	gl_FragColor = clamp(mix(uGlobalColor, texture2D(uTexture0, vTex0), 0.5) /* * (0.1*uAmbientColor + 0.6*diffuse + 1.2*specular + 0.3*direct)*/, 0.0, 1.0);
	gl_FragColor.a = 1.0;
}