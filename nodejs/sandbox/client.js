const http = require('http');  

const postData = JSON.stringify({
	  'msg': 'Hello World!'
	});

const options = {
	hostname: 'localhost',
	port: 3000,
	path: '',
	method: 'POST',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
		'Content-Length': Buffer.byteLength(postData)
	}
};



function doRequest(options) {
	return new Promise((resolve, reject) => {
		const data = [];
		const req = http.request(options, (res) => {
			res.setEncoding('utf8');
			res.on('data', (chunk) => {
				data.push(chunk);
			});
			res.on('end', () => {
				console.log(`Data:${data}`);
				resolve(data.join(''));
			});
		});
		req.on('error', (e) => {
			reject(`problem with request: ${e}`);
		});
		
		// write data to request body
		req.write(postData);
		req.end();
	});
}


console.log('Received: ' + doRequest(options));