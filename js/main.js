import { getConsole } from './lib/console/console.js'
import { Path, CurrentDir } from './lib/loader/path.js'
import SoundManager from './sound-manager.js'

const speed = 6
const length = 0.4

var _cons = await getConsole()
var _sm = new SoundManager()
var btn = document.querySelector('button')
var _isRunning = false
var _timer = null
var _count = 0
var _f1 = 0n, _f2 = 1n

var _seed = 19790420
function rand(seed) {
    _seed = (seed ?? _seed) >>> 0
    _seed = (1664525 * _seed + 1013904223) >>> 0;
    return _seed
}

function playSound(dt) {
    _count++
    if (_count >= speed) {
        let f0 = _sm.p2f(_f1, 2, 7)
        let f1 = _sm.p2f(_f1, 2, 14)
        let f2 = _sm.p2f(_f1, 2, 16)
        let f3 = _sm.p2f(_f1, 2, 18)
        _cons.writeln(`${_f1} => ${f0}Hz`)
        _sm.tone(f0, 0.40, length, 'square', 0)
        _sm.tone(f1, 0.30, length, 'sawtooth', 0)
        _sm.tone(f2, 0.22, length, 'sawtooth', 0)
        _sm.tone(f3, 0.15, length, 'sawtooth', 0)
        // const tmp = _f1
        // _f1 = _f2
        // _f2 += tmp
        //_f1++
        _f1 = rand()
        _count -= speed
    }
    _timer = requestAnimationFrame(playSound)
}

function toggleSound() {
    _isRunning = !_isRunning
    if (_isRunning) {
        btn.innerHTML = 'Stop Sound'
        _timer = requestAnimationFrame(playSound)
    } else {
        btn.innerHTML = 'Play Sound'
        cancelAnimationFrame(_timer)
    }
}

document.querySelector('button').addEventListener('click', toggleSound);
