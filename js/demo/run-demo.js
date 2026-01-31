import { Url } from '../lib/loader/url.js'

var _demo = null;

async function loadDemo() {
    if (_demo != null) {
        await unloadDemo();
    }

    let url = new Url(location.href);
    let name = url.hash.substring(1);
    url.pathname += `${name}/${name}.js`;
    url.hash = '';
    console.log('loading...' + url.toString())
    let mdl = await import(url.toString());
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url.pathname.replace('.js', '.css');
    document.head.appendChild(link);
    _demo = Reflect.construct(mdl.default, []);
    // await _demo.initialize();
    // _demo.run();
}

async function unloadDemo() {
    _demo.stop();
    await _demo.destroy();
}

window.addEventListener('load', loadDemo);
window.addEventListener('hashchange', loadDemo);
window.addEventListener('pagehide', unloadDemo);
