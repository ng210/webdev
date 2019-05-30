var URL=window.location.href.indexOf('localhost') != -1 ? 'http://localhost:3000' : 'https://ng210.herokuapp.com';

var _xhr = null;
async function send(resource, data) {
    if (_xhr == null) {
        // create xmlhttprequest
        if (window.XMLHttpRequest !== undefined) {
            _xhr = new XMLHttpRequest();
        } else {
            if (window.ActiveXObject !== undefined) {
                _xhr = new ActiveXObject("Microsoft.XMLHTTP");
            } else {
                throw new Error('Could not create XmlHttpRequest object!');
            }
        }
    }
    // open connection
    _xhr.open('GET', `${URL}/${resource}/${data}`);
    _xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
    //_xhr.overrideMimeType('application/json; charset=utf-8');

    return new Promise((resolve, reject) => {
        _xhr.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status < 200 || this.status >= 300) {
                    // reject with error
                    var errorText = this.statusText ? `Error: ${this.statusText} (${this.status})` : 'Network error!';
                    reject(new Error(errorText));
                } else {
                    // resolve with the response
                    resolve(JSON.parse(this.responseText));
                }
            }
        };
        try {
            _xhr.send();
        } catch (error) {
            // reject with error
            reject(error);
        }
    });
}

var _columns = { "ID": "id", "Weight":"weight", "Name":"name", "Description":'description'};

function addRow(list, data) {
    var row = document.createElement('tr');
    list.appendChild(row);
    for (var i in _columns) {
        var value = data[_columns[i]] || 'N.A.';
        var td = document.createElement('td');
        if (i == 'ID' && data.resource != undefined) {
            var a = document.createElement('a');
            a.setAttribute('href', `${URL}/${data.resource}/${value}`);
            a.innerHTML = value;
            td.appendChild(a);
        } else {
            td.innerHTML = value;
        }
        row.appendChild(td);
    }
}

async function search(expression) {
    try {
        if (typeof expression === 'string' && expression.length > 2) {
            if (_exactmatch.checked) {
                expression += '?exact';
            }
            var response = await send('search', expression);
            // process results
            if (response.error) {
                throw new Error(response.error);
            }
            if (!Array.isArray(response.data)) {
                throw new Error('Corrupt data');
            }
            // delete result list
            while (_resultlist.rows.length > 1) {
                _resultlist.removeChild(_resultlist.rows[1]);
            }
            if (response.data.length > 0) {
                for (var i=0; i<response.data.length; i++) {
                    addRow(_resultlist, response.data[i]);
                }
            } else {
                var tr = document.createElement('tr');
                var td = document.createElement('td');
                td.setAttribute('colspan', Object.keys(_columns).length);
                td.className = 'warning';
                td.innerHTML = 'The search did not return any items!';
                tr.appendChild(td);
                _resultlist.appendChild(tr);
            }
        }
    } catch (error) {
        alert(error.stack);
    }
}

function search_onkeypress(e) {
    // check keys
    if (e.keyCode == 13) {
        search(this.value);
    }    
}

function search_onclick(e) {
    search(_input.value);
}

var _input = null, _button = null, _resultlist = null, _exactmatch = null;
window.onload = function() {
    _input = document.getElementById('searchtext');
    _button = document.getElementById('searchbutton');
    _resultlist = document.getElementById('resultlist');
    _exactmatch = document.getElementById('exactmatch');
    _input.onkeypress = search_onkeypress;
    _button.onclick = search_onclick;

    // prepare table for result list
    var header = document.createElement('tr');
    for (var i in _columns) {
        var th = document.createElement('th');
        th.innerHTML = i;
        header.appendChild(th);
    }
    _resultlist.appendChild(header);
};