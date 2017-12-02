include('frmwrk/fw.js');

var Logger = require('../utils/Logger.js');
//include('utils/Logger.js');

if (typeof onpageload === 'function') window.onload = onpageload;

var g_logger = null;

function loadTest(content) {
    var data = load('deploy.lst', function(data){
        g_logger.info('Data: ' + data.replace(/\n/g, '<br/>'));
        g_logger.info('<hr/>');
    }, function(error) {
        g_logger.error('Error: ' + error.message);
        g_logger.info('<hr/>');
    });

    var data = load(['deploys.lst', 'dummy.js'], function(result){
        g_logger.info(result.map(function(item, ix) { return ix + ': ' + item + ';'; }).join('<br/>'));
        g_logger.info('<hr/>');
    }, function(result) {
        g_logger.info(result.map(function(item, ix) { return ix + ': ' + (item.message ? item.message : item) + ';'; }).join('<br/>'));
        g_logger.info('<hr/>');
    });
}

function requireTest(content) {
    var dummy = require('dummy.js');
    dummy.func1();
    g_logger.info('<hr/>');
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
    var el = document.createElement('div');
    el.innerHTML = load('app.cfg');
    var cfg = parseElement(el);
    g_logger.info('app.name: ' + cfg.app.name);
    g_logger.info('app.title: ' + cfg.app.title);
    g_logger.info('debug is ' + (cfg.app.debug=='0' ? 'off' : 'on'));
}

function onpageload(e) {
    var content = document.getElementById('content');
    g_logger = new Logger({
        format: '<tt>#{{counter}} <b>{{level}}</b> - <i>{{file}}::{{method}}</i>({{line}}):</tt> {{message}}<br/>',
        level: 'info',
        print: {
            context: null,
            method: function(data) {
                content.innerHTML += data;
            }
        }
    });

    loadTest(content);

    requireTest(content);

    arrayTest(content);

    //loggerTest(content);

    parseElementTest(content);
}
