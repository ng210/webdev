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

function readWebAccessFile(dir) {
    var allow = false;
    var fileName = path.resolve(dir, 'web-access.json');
    console.debug(`check access file '${fileName}'`);
    if (fs.existsSync(fileName)) {
        // process file
        console.debug(`read access file '${fileName}'`);
        var file = fs.readFileSync(fileName, { encoding: 'utf-8' });
        var content = JSON.parse(file);
        allow = content.default.toLowerCase() == 'allow';
        if (content.allow) {
            for (var i=0; i<content.allow.length; i++) {
                var entry = path.resolve(dir, content.allow[i]);
                webAccess[entry] = true;
            }
        }
        if (content.deny) {
            for (var i=0; i<content.deny.length; i++) {
                var entry = path.resolve(dir, content.deny[i]);
                webAccess[entry] = false;
            }
        }
    } else {
        // inherit from parent
        console.debug(`check parent dir '${dir}'`);
        if (dir != documentPath) {
            var parent = path.dirname(dir);
            readWebAccessFile(parent);
            allow = webAccess[dir] != undefined ? webAccess[dir] : webAccess[parent];
        } else {
            console.debug(`documentPath accessed: '${dir}'`);
        }
    }
    if (webAccess[dir] == undefined) {
        webAccess[dir] = allow;
    }
}

function checkWebAccess(resPath) {
    if (resPath.toLowerCase().endsWith('web-access.json')) return false;
    var dir = path.dirname(resPath);
    console.debug(`check access for '${dir}'`);
    if (webAccess[dir] == undefined) {
        // read the web-access file
        readWebAccessFile(dir);
    }
    var isGranted = webAccess[resPath] != undefined ? webAccess[resPath] : webAccess[dir];
    console.debug(`Access granted: ${isGranted}`);
    return isGranted;
}

app.get('/*', function(req, resp) {
    var resPath = path.normalize(path.join(documentPath, req.path));
    console.debug(`Access '${resPath}'`);
    try {
        if (fs.statSync(resPath).isDirectory()) resPath += 'index.html';
        if (fs.existsSync(resPath) && checkWebAccess(resPath)) {
            resp.sendFile(resPath);
        } else {
            throw new Error('File not found!');
        }
    } catch (err) {
        resp.status(404).sendFile(`${__dirname}/404.html`);
    }
});


console.log(`server is listening on ${port}`);

app.listen(port);
