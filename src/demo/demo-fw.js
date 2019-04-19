include('/base/dbg.js');
include('/ge/ge.js');
include('/demo/demo.js');

var canvas_ = null;
var settings_ = null;
var demos_ = [];

function onpageload(errors) {
    if (errors && errors.length > 0) {
        alert('Error during loading!\n' + errors.join('\n'));
    }
    canvas_ = document.querySelector('#cvs');
    settings_ = document.querySelector('#settings');
    settings_.style.zIndex = 1000;
    settings_.onmouseover = e => settings_.style.opacity = this.clicked ? 0.5 : 0.2;
    settings_.onmouseout = e => {
        if (e.target == settings_) {
            this.clicked = false;
            settings_.style.opacity = 0.1;
        }
    };
    settings_.onclick = e => { this.clicked = true; settings_.style.opacity = 0.5; };
    settings_.style.opacity = 0.1;

    var cnt = document.querySelector('#cvs-container');

    // canvas_.style.width = cnt.clientWidth + 'px';
    // canvas_.style.height = cnt.clientHeight + 'px';
    GE.init(canvas_);
    Dbg.init('con', canvas_.width);
    Dbg.prln('Demo-fw 0.1');
    Dbg.con.style.visibility = 'visible';

    demoResize();

    // run main loop
    GE.processInputs = demoProcessInputs;
    GE.update = demoUpdate;
    GE.render = demoRender;

    var url = new Url(document.URL);
    var demoId = url.query.id || url.fragment;

    createDemo(demoId);
};

async function createDemo(id) {
    try {
        // async load demo
        var demo = await Demo.load(id);
        if (demo !== null) {
            // set up ui
            demo.createUi();
            // do async preparations, like loading resources
            await demo.prepare();
            // initialize demo after
            demo.initialize();
            // render ui into the #settings_ node
            demo.renderUi(settings_);
            demos_.push(demo);

            // start main loop
            GE.start();
        }
    } catch (error) {
        Dbg.prln(error.stack);
    }
}

function demoProcessInputs() {
    for (var i=0; i<demos_.length; i++) {
        demos_[i].processInputs();
    }
}

function demoUpdate(frame, dt) {
    for (var i=0; i<demos_.length; i++) {
        demos_[i].update(frame, dt);
    }
}

function demoRender(frame) {
    for (var i=0; i<demos_.length; i++) {
        demos_[i].render(frame);
    }
}

function demoResize() {
    var cnt = document.querySelector('#cvs-container');
    // rescale canvas
    GE.canvas.style.width = cnt.clientWidth;
    GE.canvas.style.height = cnt.clientHeight;
    // resize and position debug console
    Dbg.con.style.width = cnt.clientWidth;
    var top = 3*cnt.clientHeight/4;
    Dbg.con.style.height = cnt.clientHeight - top;
    Dbg.con.style.top = top;
}

window.onresize = function(e) {
    demoResize(e);
    for (var i=0; i<demos_.length; i++) {
        demos_[i].onresize(e);
    }
}