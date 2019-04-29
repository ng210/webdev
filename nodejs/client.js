var cons = {
	el: null,
	lastRefresh: 0,
	timer: null,
	init: function(id) {
		this.el = document.getElementById(id);
		this.refresh();
	},
	refresh: function() {
		clearTimeout(this.timer);
		request.send(
			{
				url: 'http://localhost:3000/console',
				method: 'post',
				body: JSON.stringify({ t: this.lastRefresh })
			}, function(err, resp) {
				if (err === null && resp !== '') {
					var arr = resp.split('<timestamp>');
					cons.lastRefresh = arr[1];
					if (arr[0].length > 0) {
						cons.log(arr[0], 'server');
					}
				}
			}
		)
		this.timer = setTimeout( function(cn) {
			cn.refresh.call(cn);
		}, 1000, this);
	},
	log: function(txt, mode) {
		mode = mode || 'client';
		cons.el.innerHTML += '<span class="' + mode + '">' + txt + '</span><br/>';
	}
};

function send() {
	// collect data
	var data = {
		name: document.getElementById('name').value,
		items: []
	};
	var items = document.getElementById('items').value.split('\n');
	for (var i=0; i<items.length; i++) {
		data.items.push(items[i]);
	}
	var json = JSON.stringify(data);
	cons.log(json);
	request.send({
		url: 'http://localhost:3000/create',
		method: 'POST',
		// headers: {
		// 	'Content-Type': 'application/x-www-form-urlencoded',
		// 	'Content-Length': data.length
		// },
		body: json
	}, onreceive);
}

function onreceive(err, resp) {
	if (!err) {
		cons.log(`Received:${resp}`);
	} else {
		cons.log(`Error: ${err.message}`);
	}
}

function doRequest(options) {
	return new Promise((resolve, reject) => {
		const data = [];
		const req = http.request(options, (res) => {
			res.setEncoding('utf8');
			res.on('data', (chunk) => {
				data.push(chunk);
			});
			res.on('end', () => {
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

window.onload = function() { cons.init('console'); };