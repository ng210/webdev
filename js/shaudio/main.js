include('src/app.js');

async function onpageload(e) {
    if (e.length) {
        alert(e.join('\n'));
    }

    Dbg.init('con');
    await App.init();
}