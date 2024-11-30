include('/lib/base/dbg.js');
include('./map-app.js');

var _mapApp = null;

async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    } else {
        Dbg.init('con');
        document.body.style.display = 'block';
        _mapApp = new MapApp();
        try {
            webGL.init(null, true);
            await _mapApp.initialize({
                'size': [32, 20],
                'service': 'http://localhost:4000/js/map/map-api/'
            });
        } catch (err) {
            Dbg.prln(err);
            console.error(err);
        }

        _mapApp.run(0);
    }
}