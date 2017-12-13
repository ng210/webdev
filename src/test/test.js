include('frmwrk/fw.js');
include('utils/Logger.js');
var Logger = require('/utils/Logger.js');
var fw = require('/frmwrk/fw.js');

if (typeof onpageload === 'function') window.onload = onpageload;

var g_logger = null;

function loadTest(content) {
    var data = load('deploy.lst');
    g_logger.info('load deploy.lst<pre>' + data + '</pre><hr/>');

    var data = load('deploys.lst');
    g_logger.info('load deploys.lst<pre>' + data + '</pre><hr/>');
    
    data = load('deploy.lst', function(data, xhr) {
        g_logger.info('load async ' + xhr.options.url + '<pre>' + data + '</pre><hr/>');
    }, function(error, xhr) {
        g_logger.info(xhr.options.url + ' Error: ' + error.message + '<hr/>');
    });

    data = load('deploys.lst', function(data) {
        g_logger.info('load async ' + xhr.options.url + '<pre>' + data + '</pre><hr/>');
    
    }, function(error, xhr) {
        g_logger.info('load async ' + xhr.options.url + 'Error: ' + error.message + '<hr/>');
    });

    var arr = ['deploys.lst', 'dummy.js'];
    var text = ['load ' + arr];
    data = load(arr);
    data.forEach( function(item, ix) {
        text.push(' - ' + arr[ix] + ': ' + item);
    });
    text.push('<hr/>');
    g_logger.info(text.join('<br/>'));
    
    load(arr, function(data) {
            var text = ['load aync ' + arr];
            data.forEach( function(item, ix) {
                text.push(' async ' + arr[ix] + '<pre>' + item + '</pre>');
            });
            text.push('<hr/>');
            g_logger.info(text.join('<br/>'));
        }, function(error) {
            var text = ['load aync ' + arr];
            error.forEach( function(item, ix) {
                if (item instanceof Error) {
                    text.push(' - ' + arr[ix] + ' Error: ' + item.message);
                } else {
                    text.push(' - ' + arr[ix] + ' Item: ' + item);
                }
            });
            text.push('<hr/>');
            g_logger.info(text.join('<br/>'));
        }
    );
}

function requireTest(content) {
    var dummy = require('./dummy.js');
    dummy.func1();

}

function arrayTest(content) {
    var arr = new fw.Array();
    arr.push('alma');
    arr.push('szilva');
    g_logger.info('arr.class = ' + arr.getClass());
}

function loggerTest() {
    for (var i=0; i<Logger.levels.length; i++) {
        g_logger.setLevel(i);
        g_logger.trace(i + ' log test');
        g_logger.debug(i + ' log test');
        g_logger.info(i + ' log test');
        g_logger.warn(i + ' log test');
        g_logger.error(i + ' log test');
    }
}

function parseElementTest() {
    var cfg = load({url: 'app.cfg', contentType: 'text/xml' });
    g_logger.info('app.name: ' + cfg.app.name);
    g_logger.info('app.title: ' + cfg.app.title);
    g_logger.info('debug is ' + (cfg.app.debug=='0' ? 'off' : 'on'));
}

function hash(i) {
    var j = 0;
    if (i > 0) {
        j = (i+1)>>1;
    }
    k = j*j; 
    return i%2 == 0 ? k : -k;
}

function hashTest() {
    var n = 65539; // 4k+3 -> prime
    var m = [];
    for (var i=0; i<n; i++) {
        m.push(0);
    }
    var collisions = [];
    for (var i=0; i<n; i++) {
        var k = hash(i, n) % n;
        if (k < 0) k += n;
        //g_logger.info(k);
        m[k]++;
        if (m[k] > 1) {
            if (collisions.indexOf(k) == -1) {
                collisions.push(k);
            }
        }
    }
    if (collisions.length > 0) {
        collisions.forEach( k => {
            g_logger.info('Fail at ' + k);
        });
    } else {
        g_logger.info('No collisions!');
    }
}

function urlInfoTest() {
    var url = 'https://max:muster@www.example.com:8080/users/ng210/index.html?k1=v&k2=v2&k3#resource';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    var url = 'https://www.example.com/users/ng210/index.html?k1=v&k2=v2&k3';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    var url = 'https://www.example.com/users/ng210/index.html';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    var url = 'https://www.example.com/users/ng210';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    var url = 'www.example.com/users/ng210';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    var url = '/users/ng210/index.html?k1=v&k2=v2&k3#ressource';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    var url = '../index.html?k1=v&k2=v2&k3#ressource';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
}

function onpageload(e) {
    var content = document.getElementById('content');
    g_logger = new Logger({
        format: '<small><b>{{level}}</b> - <i>{{file}}::{{method}}</i>({{line}})</small> - ' +
                '<tt>{{message}}</tt></br>',
                //'<div style="font-size: large; background-color: silver; margin: 0px; padding: 0px"><tt>{{message}}</tt></div>',
        level: 'info',
        print: {
            context: null,
            method: function(data) {
                content.innerHTML += data;
            }
        }
    });

    loadTest(content);

    urlInfoTest();

    requireTest(content);

    arrayTest(content);

    loggerTest(content);

    parseElementTest(content);

    hashTest();
}

