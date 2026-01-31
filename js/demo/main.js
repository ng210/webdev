import { Url } from '../lib/loader/url.js'

var _demo = null;

async function loadDemo(url) {
    if (_demo != null) {
        await unloadDemo();
    }

    console.log('loading...' + url.toString())
    let mdl = await import(url.toString());
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url.pathname.replace('.js', '.css');
    document.head.appendChild(link);
    _demo = Reflect.construct(mdl.default, []);
    await _demo.initialize();
    _demo.run();
}

async function unloadDemo() {
    _demo.stop();
    await _demo.destroy();
}

async function loadDemoList() {
    fetch('demo-list.json').then(async resp => {
        if (!resp.ok) throw new Error('Failed to fetch demo-list.json: ' + resp.statusText);
        let index = await resp.json();
        for (let item of index) {
            // create nav entry
            let li = document.createElement('div');
            li.className = 'navitem';
            li.textContent = item.name;
            console.log('Nav item: ' + item.name)
            li.addEventListener('click',
                e => loadDemo(new URL(item.url, document.location.href))
                .catch(err => {
                    console.error('*** Load error: ' + err.message);
                }));
            document.querySelector('nav').appendChild(li);
        }
    }).catch(err => {
        console.error('*** Index load error: ' + err.message);
    });
}

function onload() {
    let url = new Url(location.href);
    let name = url.hash.substring(1);
    if (name == '') {
        loadDemoList();
        return;
    }
    url.pathname += `${name}/${name}.js`;
    url.hash = '';
    loadDemo(url);
}

window.addEventListener('load', onload);
window.addEventListener('hashchange', onload);
window.addEventListener('pagehide', unloadDemo);