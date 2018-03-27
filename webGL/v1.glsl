//#extension OES_standard_derivatives : enable

uniform mat4 modelMatrix;
uniform mat4 viewProjectionMatrix;

uniform float angle;
uniform float vx;
uniform float vy;
uniform vec3 cameraPos;

//uniform vec2 heightMapSize;

uniform sampler2D heightMap;
//uniform vec3 lightDir;

attribute vec4 vPosition;
attribute vec4 vTexCoord;

varying vec2 v_texCoord;
varying vec4 v_wposition;
varying float v_height;
varying float distFromCam;

void main() {
	vec4 pos = vPosition;
	vec2 texCoord = vec2(vTexCoord.x, 1.0 - vTexCoord.y);
	//pos.y = texture2DLod(heightMap, texCoord, 0.0).x;
	//float d1 = distance(2.0*(vTexCoord.xy-vec2(0.5, 0.5)), vec2(-0.5,0));
	//float d2 = distance(2.0*(vTexCoord.xy-vec2(0.5, 0.5)), vec2(0.5, 0));
	//float y1 = sin(vy*d1-angle);
	//float y2 = sin(vx*d2-angle);
	//pos.y += (1.0-d1)*y1 + (1.0-d2)*y2;
	float h = texture2DLod(heightMap, texCoord, 0.0).x;
	pos.y = h;	// + sin(vy*angle+h)*cos(vx*angle+h)*h;
	v_height = pos.y;
	v_wposition = modelMatrix*pos;
	if (pos.y < 0.0) v_wposition.y = 0.0;
	distFromCam = clamp(distance(cameraPos, v_wposition.xyz), 0.0, 200.0)/200.0;
	gl_Position = viewProjectionMatrix*v_wposition;

	v_texCoord = vTexCoord.xy;
}
