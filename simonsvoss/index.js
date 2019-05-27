/******************************************************************************
 * 
 * JSON based API for searching
 * Searchable resources are described in the resource-types.json.
 * 
 * GET the result of a search sent to '/search/<search>'
 *  returns an error message or a list of Lock objects matching the search
 *  { "error": "", data: [{SID object1}, {SID object2}, ...] }
 * 
 ******************************************************************************/

const express = require('express');
const model = require('./model.js');

const app = express();
// parse body as JSON
app.use(express.json());
const port = process.env.PORT || 3000;

// Retrieve
app.get('/search/:search', function(req, resp) {
    resp.header('Access-Control-Allow-Origin', req.headers['origin']);
    resp.end(model.search(req.params.search));
});
app.get('/:resource/:id', function(req, resp) {
    resp.header('Access-Control-Allow-Origin', req.headers['origin']);
    var item = model.index[req.params.id];
    if (req.params.resource == item._type) {
        var data = {};
        for (var i in item) {
            // references are excluded
            if (typeof(item[i]) === 'object') continue;
            data[i] = item[i];
        }
        resp.end(JSON.stringify(data));
    } else {
        resp.sendStatus(404);
    }
});
app.get('/*', function(req, resp) {
    console.log('404');
    resp.header('Access-Control-Allow-Origin', req.headers['origin']);
    resp.sendStatus(404);
});

// Options for CORS requests
app.options("/search*", function(req, resp, next) {
    resp.header('Access-Control-Allow-Origin', '*');
    resp.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    resp.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length,X-Requested-With');
    resp.sendStatus(200);
});

console.log(`server is listening on ${port}`);
model.prepare();
app.listen(port);
