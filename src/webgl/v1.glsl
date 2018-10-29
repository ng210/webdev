attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec2 aTex0;

varying vec3 vNormal;
varying vec4 vPos;
varying vec3 vLightDir1;
varying vec3 vLightDir2;
varying vec3 vLightDir3;
varying vec2 vTex0;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform float uDTime;
uniform vec4 uLightPos1;
uniform vec4 uLightPos2;
uniform vec4 uLightPos3;
uniform vec3 uRotAxis;

mat4 rotation(vec3 a, float r) {
	float c = 1.0 - cos(r);
	vec3 sa = sin(r) * a;
	return mat4(
		cos(r)+a.x*a.x*c, a.x*a.y*c-sa.z, a.x*a.z*c+sa.y, 0.0,
		a.x*a.y*c+sa.z, cos(r)+a.y*a.y*c, a.y*a.z*c-sa.x, 0.0,
		a.x*a.z*c-sa.y, a.y*a.z*c+sa.x, cos(r)+a.z*a.z*c, 0.0,
		0.0, 0.0, 0.0, 1.0
	);
}

void main() {
    mat4 rot = rotation(uRotAxis, uDTime);
    float disp = 1.0; // + 0.5*sin(PI*aPos.x*uDTime*0.1)*cos(PI*aPos.y*uDTime*0.1);
    vPos = vec4(aPos*disp, 1.0);
    vPos = uView * uModel * vPos;
    vLightDir1 = normalize(uView * uLightPos1 - vPos).xyz;
    vLightDir2 = normalize(uView * uLightPos2 - vPos).xyz;
    vLightDir3 = normalize(uView * uLightPos3 - vPos).xyz;
    vNormal = normalize(uView * uModel * vec4(aPos*disp, 0.0)).xyz;
    //vNormal = rotation(vec3(0.0, 1.0, 0.0), uDTime) * vec4(aNormal, 1.0);
    //vNormal = uModelView * vNormal;
    gl_Position = uProjection * vPos;
    gl_PointSize = 16.0*(4.0 + 0.5*vPos.z/vPos.w);
    vTex0 = aTex0;
}