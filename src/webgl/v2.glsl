uniform mat4 uProjection;
uniform mat4 uModel;
uniform mat4 uView;
uniform vec4 uLightPos;

attribute vec3 aPos;

varying vec4 vPos;
varying vec3 vNormal;
varying vec3 vLightDir;
//varying float vDist;
 
void main () {
    vNormal = normalize(uView * uModel * vec4(aPos, 0.0)).xyz;
    vPos = uView * uModel * vec4(aPos, 1.0);
    vLightDir = normalize(uView * uLightPos - vPos).xyz;
    gl_Position = uProjection * vPos;
}