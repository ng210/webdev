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

const app = express();
// parse body as JSON
app.use(express.json());
const port = process.env.PORT || 3000;

// Create
app.post('/sids', function(req, resp) {
	resp.end(Sid.create(req.body));
});

// Retrieve
app.get('/sids/:search', function(req, resp) {
    resp.end(Sid.retrieve(req.params.search));
});

// Update
app.put('/sids/:search', function(req, resp) {
    resp.end(Sid.update(req.params.search, req.body));
});

// Delete
app.delete('/sids/:search', function(req, resp) {
    resp.end(Sid.delete(req.params.search));
});

console.log(`server is listening on ${port}`);
app.listen(port);
