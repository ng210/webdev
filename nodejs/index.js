const DEBUG = false;
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;
var tokens = process.argv[1].split(path.sep);
tokens.pop(); tokens.pop();
const documentPath = process.argv[2] || tokens.join(path.sep);
console.log(`documentPath=${documentPath}`);

const webAccess = {};
const links = {};

function readWebAccessFile(dir) {
    let allow = false;
    let fileName = path.resolve(dir, 'web-access.json');
    if (DEBUG) console.debug(`check access file '${fileName}'`);
    if (fs.existsSync(fileName)) {
        // process file
        if (DEBUG) console.debug(`read access file '${fileName}'`);
        let file = fs.readFileSync(fileName, { encoding: 'utf-8' });
        let content = JSON.parse(file);
        allow = content.default.toLowerCase() == 'allow';
        if (content.allow) {
            for (let i=0; i<content.allow.length; i++) {
                let entry = path.resolve(dir, content.allow[i]);
                webAccess[entry] = true;
            }
        }
        if (content.deny) {
            for (let i=0; i<content.deny.length; i++) {
                let entry = path.resolve(dir, content.deny[i]);
                webAccess[entry] = false;
            }
        }
    } else {
        // inherit from parent
        if (DEBUG) console.debug(`check parent dir '${dir}'`);
        if (dir != documentPath) {
            let parent = path.dirname(dir);
            readWebAccessFile(parent);
            allow = webAccess[dir] != undefined ? webAccess[dir] : webAccess[parent];
        } else {
            if (DEBUG) console.debug(`documentPath accessed: '${dir}'`);
        }
    }
    if (webAccess[dir] == undefined) {
        webAccess[dir] = allow;
    }
}

function checkWebAccess(resPath) {
    if (resPath.toLowerCase().endsWith('web-access.json')) return false;
    let dir = path.dirname(resPath);
    if (DEBUG) console.debug(`check access for '${dir}'`);
    if (webAccess[dir] == undefined) {
        // read the web-access file
        readWebAccessFile(dir);
    }
    let isGranted = webAccess[resPath] != undefined ? webAccess[resPath] : webAccess[dir];
    if (DEBUG) console.debug(`Access granted: ${isGranted}`);
    return isGranted;
}

function readLinks(resPath) {
    let linkedPath = null;
    let dir = path.dirname(resPath);
    if (links[dir] === undefined) {
        links[dir] = false;
        let linksPath = path.resolve(dir, "links.json");
        if (fs.existsSync(linksPath)) {
            if (DEBUG) console.debug(`read links file '${linksPath}'`);
            links[dir] = {};
            let file = fs.readFileSync(linksPath, { encoding: 'utf-8' });
            let arr = JSON.parse(file);
            for (let ai in arr) {
                let fileName = path.basename(arr[ai]);
                links[dir][fileName.toLocaleLowerCase()] = arr[ai];
            }
        }
    }

    if (links[dir]) {
        let fileName = path.basename(resPath).toLocaleLowerCase();
        if (fs.existsSync(links[dir][fileName])) {
            linkedPath = links[dir][fileName];
        }
    }

    return linkedPath;
}

function setHeaders(resp, path) {
    let headers = {};
    if (DEBUG) console.debug(`Set headers for '${path}'`);
    if (path.endsWith('.vs') || path.endsWith('.fs')) {
        headers['Content-Type'] = 'text/plain';
    }
    return headers;
}

app.get('/*', function(req, resp) {
    let resPath = path.normalize(path.join(documentPath, req.path));
    if (DEBUG) console.debug(`Get '${resPath}'`);
    try {
        let linkedPath = readLinks(resPath);
        if (!linkedPath && fs.statSync(resPath).isDirectory()) {
            resPath = path.resolve(resPath, 'index.html');
        }
        if (checkWebAccess(resPath)) {
            if (linkedPath) resPath = linkedPath;
            else if (!fs.existsSync(resPath))
                throw new Error('File not found!');
            resp.sendFile(resPath);
        } else {
            throw new Error('Not found!');
        }
    } catch (err) {
        resp.status(404).sendFile(`${__dirname}/404.html`);
    }
});

app.post('/ping/*', function(req, resp) {
    if (DEBUG) {
        console.debug(`Post '${req.url}'`);
        console.log(req.body);
    }
    resp.statusCode = 200;
    resp.send(req.body);
});

console.log(`server is listening on ${port}`);

app.listen(port);
