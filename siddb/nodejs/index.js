/******************************************************************************
 * Sid DB - RESTful API
 * Resource: SID(title, author, copyright, year)
 * - there is no ID!
 * - JSON structure: { "author": "<author>", "title": "<title>", "copyright": "<copyright>", "year": <year> }
 * 
 * Operation result
 * - JSON structure: { "error": "<error message>", data: [] }
 * 
 * Operations
 * - Create
 *      POST a Sid JSON object to '/sids'
 *      returns a result object: { "error": "", data: [] }
 * - Retrieve
 *      GET the result of a search sent to '/sids/<search>'
 *      returns a result object with array of Sid objects matching the search
 *      { "error": "", data: [{SID object1}, {SID object2}, ...] }
 * - Update
 *      PUT a Sid object to '/sids/<search>'
 *      returns a result object: { "error": "", data: [] }
 * - Delete
 *      DELETE Sid objects selected by a search at '/sids/<search>'
 *      returns a result object: { "error": "", data: [] }
 * 
 * <search> criteria
 * - title: title of the song
 * - author: author of the song
 * - year: publishing year
 * - text: full text search in either fields
 * Currently the string.contains operation is supported.
******************************************************************************/

const express = require('express');
const fs = require('fs');
const Sid = require('./sid.js');

const port = process.env.PORT || 3000;

const app = express();
// parse body as JSON
app.use(express.json());

// Create
app.post('/sids', function(req, resp) {
    resp.setHeader('content-type', 'application/json');
	resp.end(Sid.create(req.body));
});

// Retrieve
app.get('/sids', function(req, resp) {
    resp.header('Access-Control-Allow-Origin', req.headers['origin']);
    resp.setHeader('Content-Type', 'application/json;charset=utf-8');
    resp.end(Sid.retrieve(req.query));
});

// Update
app.put('/sids/:search', function(req, resp) {
    resp.setHeader('content-type', 'application/json;charset=utf-8');
    resp.end(Sid.update(req.params.search, req.body));
});

// Delete
app.delete('/sids/:search', function(req, resp) {
    resp.setHeader('content-type', 'application/json;charset=utf-8');
    resp.end(Sid.delete(req.params.search));
});

// Options for CORS requests
app.options("/sids", function(req, resp, next) {
    resp.header('Access-Control-Allow-Origin', '*');
    resp.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    resp.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length,X-Requested-With');
    resp.sendStatus(200);
});

console.log(`server is listening on ${port}`);
app.listen(port);
