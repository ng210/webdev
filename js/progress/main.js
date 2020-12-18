include('base/dbg.js');
include('glui/glui-lib.js');
include('app.js');

var _app = null;

async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    }
    Dbg.init('con');
    Dbg.prln('progress');
    _app = new App();
    glui.scale.x = 1.0;
    glui.scale.y = 1.0;
    await glui.initialize(_app, true);
    //glui.setRenderingMode(glui.Render2d);
    await _app.loadData();
    await _app.createUi();
    await _app.refresh();
    _app.paint();
    //glui.render();
    glui.animate();
}
