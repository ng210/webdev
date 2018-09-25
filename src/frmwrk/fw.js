include('base/module.js');
include('frmwrk/array.js');
include('frmwrk/map.js');
(function(){
    var fw = {
        Array: require('/frmwrk/array.js'),
        Map: require('/frmwrk/map.js')
    };
    module.exports=fw;
})();

function boot() {
    // load app.cfg
    var cfg = load({url: 'app.cfg', method: 'GET', contentType: 'text/xml'});
    if (typeof cfg === "object" && typeof cfg.app === "object") {
        var app = cfg.app;
        // load modules
        var loadInfos = [];
        app.module.forEach(x => {
            loadInfos.push({ contentType: x.type, url: x.src });
        });
        var files = load(loadInfos,
            files => {
                files.forEach((x, i) => {
                    var id = app.module[i].id;
                    if (id!=undefined) x.setAttribute('id', id);
                });
                boot2();
            }, error => {
                alert(error);
                boot2();
            }
        );

        Object.defineProperty(window.top, 'App', {
			enumerable: true,
			configurable: false,
			writable: true,
			value: app
        });
    }
}

function boot2() {
    delete App.module;
    // call user callback
    if (typeof onpageload === 'function') {
        onpageload();
    }
}

window.onload = boot;

