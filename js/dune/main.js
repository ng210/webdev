var _dragPoint = [0, 0];
var _isDragging = false;
var _map = null;
var _mapService = null;
var _time = 0;
var _frames = 0;
var _animate = 0;
var _move = [0, 0];

async function onkeydown(e) {
    var dx = 0, dy = 0;
    switch (e.which) {
        case 38: // up
            dy--;
            break;
        case 40: // down
            dy++;
            break;
        case 37: // left
            dx--;
            break;
        case 39: // right
            dx++;
            break;
        case 65: // animate
            _animate = _animate == 0 ? 1 : 0;
            break;
        case 68: // use dune tileset
            await _map.initialize('res/dune2-tiles.png', _mapService);
            break;
        case 69: // use earth tileset
            await _map.initialize('res/earth-tiles.png', _mapService);
            break;
    }
    _map.move(dx, dy);
    _map.render();
}

function onmousedown(e) {
    if (e.target.tagName == 'BUTTON') {
        var dir = e.target.getAttribute('dir');
        switch (dir) {
            case '1': _move[1] = -2; break;
            case '2': _move[1] = 2; break;
            case '4': _move[0] = -2; break;
            case '8': _move[0] = 2; break;
        }
    } else {
        _dragPoint[0] = e.clientX;
        _dragPoint[1] = e.clientY;
        _isDragging = true;
    }
}

function onmousemove(e) {
    if (_isDragging) {
        var mouseSensibility = 80.0;
        var dx = mouseSensibility*(_dragPoint[0] - e.clientX);
        var dy = mouseSensibility*(_dragPoint[1] - e.clientY);
        _map.move(dx/_map.ctx.canvas.clientWidth, dy/_map.ctx.canvas.clientHeight);
        _dragPoint[0] = e.clientX;
        _dragPoint[1] = e.clientY;
        _map.render();
    }
}

function onmouseup(e) {
    if (e.target.tagName == 'BUTTON') {
        var dir = e.target.getAttribute('dir');
        switch (dir) {
            case '1': _move[1] = 0; break;
            case '2': _move[1] = 0; break;
            case '4': _move[0] = 0; break;
            case '8': _move[0] = 0; break;
        }
    } else {
        _isDragging = false;
    }    
}

function onwheel(e) {
    //_map.zoom(e.deltaY);
}

function animate(ts) {
    var delta = ts - _time;
    _map.update(delta);
    _time = ts;
    requestAnimationFrame(animate);

    if (_move[0] != 0 || _move[1] != 0) {
        _map.move(_move[0], _move[1]);
        _map.render();
    }

    if (_frames % 25 == 0) {
        if (_animate == 1) {
            _mapService.elevation += 0.1;
            if (_mapService.elevation > 0.6) {
                _mapService.elevation = 0.6;
                _animate = 2;
            }
        } else if (_animate == 2) {
            _mapService.elevation -= 0.1;
            if (_mapService.elevation < -0.4) {
                _mapService.elevation = -0.4;
                _animate = 1;
            }
        }
        if (_animate) {
            _mapService.create();
            _map.fetch();
            _map.render();
        }
        //_mapService.levels = (_mapService.levels + 1) % 8;
    }
    _frames++;
}

window.onload = async function(e) {
    _mapService = new MapService();
    _mapService.create(200, 200);
    var w = 80, h = 64;

    _map = new Map(w, h, false);
    // _map.isShadeMode = true;
    // _mapService.shadeMode = true;

    var cvs = document.getElementById('cvs');
    await _map.initialize('res/earth-tiles.png', _mapService, cvs);
    cvs.width = _map.tiles.width*w; cvs.height = _map.tiles.height*h;
    _map.render(cvs);
    document.addEventListener('keydown', onkeydown);
    document.addEventListener('mousedown', onmousedown);
    document.addEventListener('mousemove', onmousemove);
    document.addEventListener('mouseup', onmouseup);
    document.addEventListener('wheel', onwheel);

    requestAnimationFrame(animate);
}