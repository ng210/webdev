import { Bob } from './bob.js'
import { ItemTypes, Item } from './item.js'
import { Stack } from './stack.js'

var _cols = 20, _rows = 32;
var _stack = null;
var _head = null;
var _fontSize = 0;
var _size = 32;

var _letters = [];
var _t1 = 0;
const _text = 'T e t r i s';

const _k = 0.06;
const _g = 800.2;
const _f1 = 0.3;
const _f2 = 0.02;

var _gameState = 0; // initial state
var _isRunning = true;

var _animatedBobs = [];
var _fallingItem = null;

var _audioContext = null;
var _soundEffects = {};

var _keys = {
    'left': false,
    'right': false,
    'up': false,
    'down': false
};

window.onload =
    async function onload() {
        createHeader();
        _t1 = Date.now();

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);

        _audioContext = new AudioContext();

        var soundEffects = {
            boom1: 'boom1.mp3',
            gameover: 'pacman_death.mp3',
            won: 'won.mp3'
        };
        for (var si in soundEffects) {
            _soundEffects[si] = document.createElement('audio');
            _soundEffects[si].src = soundEffects[si];
            var track = _audioContext.createMediaElementSource(_soundEffects[si]);
            track.connect(_audioContext.destination);
        }

        mainLoop();
    };

function message(text, buttons) {
    var el = document.getElementById('message');
    el.children[0].innerHTML = text;
    el.children[1].innerHTML = '';
    if (Array.isArray(buttons)) {
        for (var bi in buttons) {
            var btn = document.createElement('button');
            btn.value = bi;
            el.children[1].appendChild(btn);
        }
    }
    el.style.display = 'block';
    el.style.left = (document.body.offsetWidth - el.offsetWidth) / 2 + 'px';
    el.style.top = (document.body.offsetHeight - el.offsetHeight) / 2 + 'px';
}

function createRandomItem() {
    var types = Object.keys(ItemTypes);
    var type = types[Math.floor((types.length-1) * Math.random())];
    var item = new Item(document.querySelector('.stack'), type);
    item.setSize(_size);
    item.move((_stack.cols - item.cols) >> 1, 0);
    item.velocity[0] = 0;
    item.velocity[1] = 0.5;
    _fallingItem = item;
}

function onKeyDown(e) {
    switch (e.key) {
        case 'ArrowUp': _keys.up = true; break;
        case 'ArrowDown': _keys.down = true; break;
        case 'ArrowLeft': _keys.left = true; break;
        case 'ArrowRight': _keys.right = true; break;
    }
}

function onKeyUp(e) {
    switch (e.key) {
        case 'ArrowUp': _keys.up = false; break;
        case 'ArrowDown': _keys.down = false; break;
        case 'ArrowLeft': _keys.left = false; break;
        case 'ArrowRight': _keys.right = false; break;
    }
}

function runGameCycle(dt) {
    _stack.removeItems([_fallingItem]);
    var dx = 0;

    // check keys
    if (_keys.left) {
        _keys.left = false;
        if (_fallingItem.ci > 0) dx = -1;
    } else if (_keys.right) {
        _keys.right = false;
        if (_fallingItem.ci < _cols - _fallingItem.cols) dx = 1;
    } else if (_keys.up) {
        _fallingItem.rotate(1);
        _keys.up = false;
    } else if (_keys.down) {
        _fallingItem.acceleration[1] = 0.1;
        _animatedBobs.push(_fallingItem);
        createRandomItem();
    }

    if (_stack.canMove(_fallingItem, [dx, 0])) {
        _fallingItem.ci += dx;
        _fallingItem.position[0] = _fallingItem.ci * _fallingItem.size;
    }

    // check motion
    if (!_stack.canMove(_fallingItem, [0, 1])) {
        if (_fallingItem.ri == 0) {
            message('Game Over!');
            _gameState = 2;
        } else {
            _stack.putItems([_fallingItem]);
            createRandomItem();
        }
    }

    // update
    _fallingItem.update(dt);
    _stack.putItems([_fallingItem]);

    // render
    _fallingItem.render();
    //_stack.render();
}

var _counter = 0;
function mainLoop() {
    var t2 = Date.now();
    var dt = (t2 - _t1);

    _animatedBobs.forEach(
        b => {
            b.update(0.1 * dt);
            b.render();
        });

    switch (_gameState) {
        case 0:
            _stack = new Stack(document.querySelector('.middle'), _cols, _rows);
            _stack.setSize(_size);
            createRandomItem();
            _gameState = 1;
            break;
        case 1:
            if (_counter++ == 8) {
                runGameCycle(dt);
                _counter = 0;
            }

            break;
    }

    _t1 = t2;
    if (_isRunning) {
        requestAnimationFrame(mainLoop);
    }
}

window.onresize = function onresize(e) {
    for (var ci in _letters) {
        var lt = _letters[ci];
        calculateTargetForLetter(lt, ci);
        if (_animatedBobs.indexOf(lt) == -1) {
            _animatedBobs.push(lt);
        }
    }
}

function createHeader() {
    _head = document.getElementsByClassName('header')[0];
    // calculate letter height
    var dummy = document.createElement('div');
    dummy.className = 'letter';
    dummy.innerText = 'M';
    _head.appendChild(dummy);
    _fontSize = dummy.offsetHeight;
    _head.removeChild(dummy);

    createLetters();
}

function createLetters() {
    for (var li=0; li<_text.length; li++) {
        var lt = new Bob('letter', _head);
        lt.elem.innerHTML = _text[li];
        calculateTargetForLetter(lt, li);
        // lt.targetPosition[0] = 0.5 * document.body.offsetWidth;
        // lt.targetPosition[1] = 0.5 * document.body.offsetHeight;

        lt.position[0] = document.body.offsetWidth * (0.1 + 0.8 * li/_text.length);
        lt.position[1] = 0.1 * document.body.offsetHeight - _fontSize + 2*_fontSize * (Math.random() - 0.5);
        lt.update(0);
            // var v = 1.0 * Math.sqrt(_g / Math.sqrt(lt.distance[2]));
            // var arg = Math.atan2(lt.distance[1], lt.distance[0]);    //2*Math.PI * Math.random();
            // lt.velocity[0] = -v*Math.sin(arg);
            // lt.velocity[1] = v*Math.cos(arg);
            // console.log(lt.velocity[0], lt.velocity[1])
        _letters.push(lt);
        _animatedBobs.push(lt);
        lt.updateFunction = (bob, dt) => {
            springPhysics(bob, dt);
            //gravityPhysics(bob, dt);
        };
    }
}

function calculateTargetForLetter(lt, ix) {
    lt.targetPosition[0] = Math.floor(0.3 * _head.offsetWidth + ix * 0.4 * _head.offsetWidth / _text.length);
    lt.targetPosition[1] = Math.floor((_head.offsetHeight - _fontSize) / 2);
}

function springPhysics(bob, dt) {
    var dx = bob.distance[0];
    if (dx > 100) dx = 100;
    else if (dx < -100) dx = -100;
    var dy = bob.distance[1];
    if (dy > 100) dy = 100;
    else if (dy < -100) dy = -100;
    bob.acceleration[0] = -_k * dx - _f1 * bob.velocity[0];
    bob.acceleration[1] = -_k * dy - _f1 * bob.velocity[1];
}

function gravityPhysics(bob, dt) {
    // var ds = Math.sqrt(bob.distance[2]);
    // var dx = bob.distance[0] / ds;
    // // if (dx < 1) dx = 1;
    // // else if (dx > -1) dx = -1;
    // var dy = bob.distance[1] / ds;
    // // if (dy > 10) dy = 10;
    // // else if (dy < -10) dy = -10;
    // ds = dx*dx + dy*dy;

    var ds = Math.sqrt(bob.distance[2]);
    var f = -_g / bob.distance[2];
    if (f > 1) f = 1;
    else if (f < -1) f = -1;
    bob.acceleration[0] = f * bob.distance[0] / ds - _f2 * bob.velocity[0];
    bob.acceleration[1] = f * bob.distance[1] / ds - _f2 * bob.velocity[1];
    if (bob.distance[2] < 50) {
        bob.position[0] = bob.targetPosition[0];
        bob.velocity[0] = 0;
        bob.position[1] = bob.targetPosition[1];
        bob.velocity[1] = 0;
    }
}

function explode(field) {
    var y = 0;
    const count = 4;
    var bw = parseInt(field.elem.computedStyleMap().get("border-width"));
    var wi = (field.width - 2*bw) / count, he = (field.height - 2*bw) / count;
    for (var j=0; j<count; j++) {
        var x = 0;
        for (var i=0; i<count; i++) {
            var frac = new Bob('fraction', _board.parent);
            frac.position[0] = field.position[0] + bw + Math.round(x);
            frac.position[1] = field.position[1] + bw + Math.round(y);
            var arg = -Math.PI * ( 0.25 + 0.5 * Math.random());
            var amp = 20 * (0.4 + 0.6 * Math.random());
            frac.velocity[0] = amp * Math.cos(arg);
            frac.velocity[1] = amp * Math.sin(arg);
            frac.acceleration[0] = 0;
            frac.acceleration[1] = 1.0;
            frac.setSize(wi, he);
            frac.render();
            _animatedBobs.push(frac);
            x += wi;
        }
        y += he;
    }

    _audioContext.resume();
    _soundEffects.boom1.play();
}