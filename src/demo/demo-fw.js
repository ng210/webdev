include('/base/dbg.js');
include('/ge/ge.js');
include('demo.js');

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
    var cnt = document.querySelector('#cvs-container');
    canvas_.style.width = cnt.clientWidth + 'px';
    canvas_.style.height = cnt.clientHeight + 'px';
    Dbg.init('con', canvas_.width);
    demoResize();
    GE.init(canvas_);

    Dbg.prln('Demo-fw 0.1');

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
    Dbg.con.style.width = cnt.clientWidth - 20;
    var top = 2*cnt.clientHeight/3 - 10;
    Dbg.con.style.height = cnt.clientHeight - top;
    Dbg.con.style.top = top + 'px';
}

window.onresize = function(e) {
    for (var i=0; i<demos_.length; i++) {
        demos_[i].onresize();
    }
    demoResize();
}