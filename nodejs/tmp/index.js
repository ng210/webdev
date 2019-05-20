const express = require('express');
const fs = require('fs');
const singleton = require('./singleton.js');
const myservice1 = require('./myservice1.js');
const myservice2 = require('./myservice2.js');

const app = express();
const port = process.env.PORT || 3000;

var consoleHistory = [];

var users = [];
var items = [];

var randSeed = 1;

var sessions = {};

var mappedGetFiles = {
	'/console': '/console.html',
	'/request.js': '/request.js',
	'/client.js': '/client.js'
};

// Service tests
app.post('/srv/:id', function(req, resp) {
	var service = null;
	if (req.params.id == '1') {
		service = new myservice1.Service('http://localhost:3000', null, null);
	} else if (req.params.id == '2') {
		service = new myservice2.Service('http://localhost:3000');
	}
	if (service != null) {
		service.create(req, resp);
		resp.end();
	} else {		
		resp.end('Invalid service!');
	}
});

// Global var test
app.get('/s/:value', function(req, resp) {
	singleton.setSingleton(req.params.value, resp);
});
app.get('/s', function(req, resp) {
	singleton.getSingleton(req, resp);
});

app.get('/srv/:id/:op', function(req, resp) {
	var service = null;
	if (req.params.id == '1') {
		service = new myservice1.Service('http://localhost:3000', null, null);
	} else if (req.params.id == '2') {
		service = new myservice2.Service('http://localhost:3000');
	}
	if (service != null) {
		if (typeof service[req.params.op] === 'function') {
			service[req.params.op](req, resp);
			resp.end();
		} else {
			resp.end('Invalid service operation!');
		}
	} else {
		resp.end('Invalid service!');
	}
});

app.get('/*', function(req, resp) {
	var file = mappedGetFiles[req.path];
	if (file !== undefined) {
		resp.sendFile(__dirname + file);
	} else {
		resp.send( { status:200, message:'Interface is alive' } );
	}
});

app.post('/*', function(req, resp) {
	switch (req.path) {
		case '/console':
			refreshConsole(req, resp);
			break;
		default:
			resp.send( { status:200, message:'Interface is alive' } );
			break;
	}
});


function log(text) {
	console.log(text);
	var ts = new Date().getTime();
	consoleHistory.push([ts, text]);
	//fs.writeFile('console.log', `${ts}:text`, {encoding: 'utf8'});
}

function refreshConsole(req, resp) {
	var chunks = [];
	req.on('data', (chunk) => {
		chunks.push(chunk);
	});
	req.on('end', () => {
		var body = chunks.join('');
		var json = JSON.parse(body);
		var ts = parseInt(json.t);
		var sb = [];
		if (consoleHistory.length > 0) {
			var i = 0;
			for (; i<consoleHistory.length; i++) {
				if (consoleHistory[i][0] > ts) {
					sb.push(consoleHistory[i][1]);
				}
			}
		}
		resp.set('Content-Type', 'text/plain');
		resp.end(sb.join('<br/>') + '<timestamp>' + consoleHistory[i-1][0], { encoding:'utf8' });
	});
}

log(`server is listening on ${port}`);
app.listen(port);
