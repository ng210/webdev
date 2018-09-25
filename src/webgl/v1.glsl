attribute vec3 aPos;
//attribute vec3 aV1;
//attribute vec3 aV2;

void main() {
 //vec2 pos = vec2(aPos.x * uRotate.y + aPos.y * uRotate.x, aPos.y * uRotate.y - aPos.x * uRotate.x);
 //outValue=aPos+aV1;
    gl_Position = vec4(aPos.xy, 0.0, 1.0); //vec4(pos * uRotate, 0.0, 1.0);
    gl_PointSize = pow(1.1, aPos.z);
 //aPos.xy += aV1.xy;
 //gl_Position.z = 0.0;
}