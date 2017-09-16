const express = require('express');
const app = express();
const port = 3000;

app.get('', function(req, resp) {
	resp.end('GET: Hello Node.js Server!')
});

app.post('', function(req, resp) {
	req.on('data', (chunk) => {
		console.log(`Received: ${chunk}`);
	});
	resp.end('POST: Hello Node.js Server!')
});


console.log(`server is listening on ${port}`)
app.listen(port);
