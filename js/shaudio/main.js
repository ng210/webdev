include('src/app.js');

var App = null;

async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    }

    Dbg.init('con');
    App = new App();
    await App.test();
}