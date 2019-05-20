var request = (function() {

	function xmlHttpStateChange(xhr, callback) {
		if (xhr.readyState == 4) {
			var resp = xhr.responseText;
			if (resp === undefined)
				resp = xhr.responseBody;

			var err = null;
			if (xhr.status != 200) {
				err = { status: xhr.status, message:'Request error!' };
			}

			callback(err, resp);
		}
	}

	return  {
		send: function(options, callback) {
			var xhr = null;
			if (window.XMLHttpRequest) xhr = new XMLHttpRequest();
			else {
				if (window.ActiveXObject) xhr = new ActiveXObject("Microsoft.XMLHTTP");
				else throw 'Could not create XmlHttpRequest object!';
			}
			xhr.open((options.method || 'GET'), options.url);
			xhr.onreadystatechange = function() {
				xmlHttpStateChange(xhr, callback);
			};
			try {
				xhr.send(options.body);
			} catch (e) {
				callback(e, null);
			}
		}
	};
})(this);
