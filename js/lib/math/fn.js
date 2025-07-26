let linear = x => x;
let smoothstep = x => x*(3*x-2*x*x);
let exp = x => Math.exp(x);
let log = x => Math.log(x * (Math.E - 1.0) + 1.0);

let quantize = (x, s) => 2*Math.round(0.5*(x+1)*s)/s-1;
let lerp = (x1, x2, f) => (1-f)*x1 + f*x2;
let clamp = (x, min, max) => (x > min) ? ((x < max) ? x : max) : min;

export {
    linear, smoothstep, exp, log,
    quantize, lerp, clamp
}