var _dragPoint = [0, 0];
var _isDragging = false;
var _map = null;
var _mapService = null;
var _time = 0;

function onkeydown(e) {
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
    }
    _map.move(dx, dy);
    _map.render();
}

function onmousedown(e) {
    _dragPoint[0] = e.clientX;
    _dragPoint[1] = e.clientY;
    _isDragging = true;
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
    _isDragging = false;
}

function onwheel(e) {
    _map.zoom(e.deltaY);
}

function animate(ts) {
    var delta = ts - _time;
    _map.update(delta);
    _time = ts;
    requestAnimationFrame(animate);
}


window.onload = async function(e) {
    _mapService = new MapService();
    _mapService.create(144, 166);
    var w = 32, h = 20;

    _map = new Map(w, h, false);
    await _map.initialize('res/dune2-tiles.png', _mapService);
    var cvs = document.getElementById('cvs');
    cvs.width = _map.tiles.width*w; cvs.height = _map.tiles.height*h;
    _map.render(cvs);
    document.addEventListener('keydown', onkeydown);
    document.addEventListener('mousedown', onmousedown);
    document.addEventListener('mousemove', onmousemove);
    document.addEventListener('mouseup', onmouseup);
    document.addEventListener('wheel', onwheel);

    requestAnimationFrame(animate);
}