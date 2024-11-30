import { Model } from './model/model.js'

async function fetchJson(url) {
    var headers = new Headers();
    headers.set("content-type", "application/json");
    var resp = await fetch(url, {
        'headers': headers,
        'method': 'get',
        'body': null
    });
    var body = await resp.json();
    if (resp.status != 200) {
        if (body.error) console.error(body.error);
        body = new Error(body.error);
    }
    return body;
}

window.onload = async function() {
    var data = fetchJson('webshop.json');
    var model = new Model(data);
}
