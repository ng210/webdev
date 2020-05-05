var _page = null;
var _shadows = {};
var _shadowCount = 3;
var _shadowSize = 16;

function onpageload(e) {
    document.addEventListener('mousemove', onmousemove);
    _page = document.getElementById('page');
    //_page.addEventListener('click', onmouseclick);

    var types = ['box-shadow', 'text-shadow'];
    for (var i=0; i<types.length; i++) {
        var type = types[i];
        _shadows[type] = [];

        var shadow = { alpha: 0.5, x:0, y:0, blur: 8, spread: 64 };
        var css = window.getComputedStyle(_page)[type];
        var re = type == 'box-shadow' ? /rgba\(\d+, \d+, \d+, ([^\)]+)\) (-?\d+px) (-?\d+px) (-?\d+px) (-?\d+px)/ : /rgba\(\d+, \d+, \d+, ([^\)]+)\) (-?\d+px) (-?\d+px) (-?\d+px)/;
        var match = re.exec(css);

        if (match != null) {
            shadow.alpha = parseFloat(match[1]);
            shadow.x = parseInt(match[2]);
            shadow.y = parseInt(match[3]);
            shadow.blur = parseInt(match[4]);
            shadow.size = _shadowSize;
        }

        for (var j=0; j<_shadowCount; j++) {
            var scale = Math.pow(1.4, j);
            _shadows[type].push( {
                alpha: shadow.alpha*(1 - 0.5*j/(_shadowCount-1)),
                x: scale*shadow.x,
                y: scale*shadow.y,
                blur: Math.floor(shadow.blur*(1+j/_shadowCount)),
                size: Math.floor(shadow.size*Math.pow((1+j), 2))
            } );
        }
    }
}

function calculateShadows(element, delta) {
    for (var type in _shadows) {
        if (_shadows.hasOwnProperty(type)) {
            var styles = [];
            for (var i=1; i<_shadows[type].length; i++) {
                var shadow = _shadows[type][i];
                var scale = shadow.size/_shadowSize;
                var x = -Math.round(scale * shadow.x * delta.x);
                var y = -Math.round(scale * shadow.y * delta.y);
                var blur = shadow.blur;
                var spread = shadow.size;
                var style = `rgba(0, 0, 0, ${shadow.alpha}) ${x}px ${y}px ${blur}px`;
                if (type == 'box-shadow') style += ` ${spread}px`;
                styles.push(style);
            }
            element.style[type] = styles.join();
        }
    }
}

var _turnTimer = null;
function turnPage() {
    _page.style.animation = 'turnpage 2s linear';   // 0 1 normal forward';
}


function onmousemove(e) {
    var delta = {
        x: 2*e.clientX/document.body.offsetWidth - 1,
        y: 2*e.clientY/document.body.offsetHeight - 1
    };
    if (delta.x < -1) delta.x = 1; else if (delta.x > 1) delta.x = 1;
    if (delta.y < -1) delta.y = 1; else if (delta.y > 1) delta.y = 1;

    //calculateShadows(_page, 'box-shadow', delta);
    calculateShadows(_page, delta);
}

function onmouseclick(e) {
    turnPage();
}