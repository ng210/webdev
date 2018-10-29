include('dbg.js');
include('demo-ui.js');
include('ge.js');

var canvas_ = null;
var settings_ = null;
var demos_ = [];

window.onload = e => {
    canvas_ = document.querySelector('#cvs');
    settings_ = document.querySelector('#settings');
    settings_.style.zIndex = 1000;
    var cnt = document.querySelector('#cvs-container');
    cvs.style.width = cnt.clientWidth + 'px';
    cvs.style.height = cnt.clientHeight + 'px';
    Dbg.init('con', canvas_.width);
    Dbg.con.style.width = cnt.clientWidth - 20; //cnt.style.borderWidth;
    Dbg.con.style.top = (cnt.clientHeight/2 - 10) + 'px';

    Dbg.prln('Demo-fw 0.1');

    // run main loop
    GE.update = demoUpdate;
    GE.render = demoRender;


    // load demo
    var demo = loadDemo('demo01');
    if (demo != null) {
        try {
            DemoUI.initialize(settings_, demo);
            demo.initialize();

            demos_.push(demo);
        } catch (error) {
            Dbg.prln('Error: ' + error.stack);
        }
        GE.start();
    }

};

function loadDemo(id) {
    var demo = null;
    // load config and js
    var resources = [{ url: id+'.json', contentType: 'text/json' }, { url: id+'.js', contentType: 'text/javascript' }];
    var res = load(resources);
    var missing = [];
    res.forEach((v, k) => { if (v instanceof Error) missing.push(resources[k].url); });
    if (missing.length > 0) {
        Dbg.prln('Error loading demo! Missing file(s): ('+missing+')');
        return;
    }

    var config = res[0];
    var url = new Url(res[1].url);
    // get published class
    var key = Object.keys(_modules).find( v => v.startsWith(url) );
    if (key != null) {
        var DemoClass = _modules[key];
        demo = new DemoClass(canvas_);
        demo.config = config;
        Dbg.prln('Demo loaded');
    } else {
        Dbg.prln('Error during initialization of the demo!');
    }

    return demo;
}

function demoUpdate(frame) {
    for (var i=0; i<demos_.length; i++) {
        demos_[i].update(frame);
    }
}

function demoRender(frame) {
    for (var i=0; i<demos_.length; i++) {
        demos_[i].render(frame);
    }
}

window.onresize = function(e) {
    var cvs = document.querySelector('#cvs');
    var cnt = document.querySelector('#cvs-container');
    width = cnt.clientWidth;
    height = cnt.clientHeight;
    con.style.width = width + 'px';
    webGL.resize(gl, width, height);
}