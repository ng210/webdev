import { Board } from './board.js'
var _board = null;
var _width = 12, _height = 8, _mines = 8;
var _head = null;
var _fontSize = 0;

var _letters = [];
var _movingLetters = [];
var _t1 = 0;
const _text = 'MINESWEEPER';

const _g = 200.02;

var _gameState = 0; // initial state

window.onload = async function onload() {
    createHeader();
    _t1 = Date.now();
    mainLoop();
};


function createBoard() {
    _board = _board || new Board(document.getElementsByClassName('board')[0]);
    _board.onclick = onClickField;
    _board.onrightclick = onRightClickField;
    _board.initialize(_width, _height, _mines);
    _gameState = 1;
}

function onClickField(field) {
    if (field.value != 9) {
        _board.reveal([field]);
        console.log(_board.hiddenFields);
        if (_board.hiddenFields == 0) {
            _board.revealAll();
            alert('You won!');
        }
    } else {
        _board.revealAll();
        alert('Game over!');
    }
}

function onRightClickField(field) {
    field.div.innerText = 'F';
}

function mainLoop() {
    var t2 = Date.now();
    var dt = 2*(t2 - _t1);

    animateLetters(dt);

    switch (_gameState) {
        case 0:
            createBoard();
            break;
    }

    _t1 = t2;
    requestAnimationFrame(mainLoop);
}

window.onresize = function onresize(e) {
    for (var ci in _letters) {
        var lt = _letters[ci];
        lt.tx = Math.floor(0.3 * _head.offsetWidth + ci * 0.4 * _head.offsetWidth / _text.length);
        lt.ty = Math.floor((_head.offsetHeight - _fontSize) / 2);
        if (_movingLetters.indexOf(lt) == -1) {
            _movingLetters.push(lt);
        }
    }

    _board.resize();
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

    for (var ci in _text) {
        var div = document.createElement('div');
        div.style.left = '-100px';
        div.style.top = '-100px';
        div.className = 'letter';
        div.innerHTML += _text[ci];
        div.id = _text[ci];
        div.tx = Math.floor(0.3 * _head.offsetWidth + ci * 0.4 * _head.offsetWidth / _text.length);
        div.ty = Math.floor((_head.offsetHeight - _fontSize) / 2);
        div.vx = 0;
        div.vy = -0.02 * Math.random();
        div.px = -_fontSize;
        div.py = document.body.clientHeight - _fontSize;  //Math.floor(Math.random() * (_head.clientHeight - _fontSize));
        _head.appendChild(div);
        _letters.push(div);
        _movingLetters.push(div);
    }
}

function animateLetters(dt) {
    for (var li in _movingLetters)
    {
        var lt = _movingLetters[li];
        var dx = (lt.tx - lt.px);
        var dy = (lt.ty - lt.py);
        var ds2 = dx*dx + dy*dy;
        if (ds2 < 10000) {
             _movingLetters.splice(li, 1);
             lt.vx = 0;
             lt.vy = 0;
             lt.style.left = lt.tx + 'px';
             lt.style.top = lt.ty + 'px';
        } else {
            // th = atan(dy, dx)
            var theta = Math.atan2(dy, dx);
            // F = g*m*M/d^2
            // m <<< M
            // F = g*M/d^2  | M = 1
            // F = g/d^2
            var f = _g / ds2;
            // ax = Fx/m = F * cos(th)
            var ax = Math.cos(theta) * f;
            // ax = Fx/m = F * sin(th)
            var ay = Math.sin(theta) * f;
            //dx *= f; dy *= f;
            lt.px += lt.vx * dt;
            lt.py += lt.vy * dt;
            lt.vx += ax * dt;
            lt.vy += ay * dt;
            lt.style.left = Math.round(lt.px) + 'px';
            lt.style.top = Math.round(lt.py) + 'px';

        //console.log(r, lt.vx, lt.vy);
        }
    }
}