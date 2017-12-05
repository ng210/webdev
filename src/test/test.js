include('frmwrk/fw.js');

var Logger = require('../utils/Logger.js');
//include('utils/Logger.js');

if (typeof onpageload === 'function') window.onload = onpageload;

var g_logger = null;

function loadTest(content) {
    g_logger.info('load(\'deploy.lst\')');
    var data = load('deploy.lst');
    g_logger.info('<pre>' + data + '</pre>');
    g_logger.info('load(\'deploys.lst\')');

    var data = load('deploys.lst');
    g_logger.info('<pre>' + data + '</pre>');

    
    g_logger.info('load(\'deploy.lst\', onload, onerror)...');
    data = load('deploy.lst', function(data) {
        g_logger.info('<pre>' + data + '</pre>');
    
    }, function(error) {
        g_logger.error('Error: ' + error.message);
    
    });
    g_logger.info('load(\'deploys.lst\', onload, onerror)...');
    data = load('deploys.lst', function(data) {
        g_logger.info('<pre>' + data + '</pre>');
    
    }, function(error) {
        g_logger.error('Error: ' + error.message);
    
    });

    g_logger.info('load([\'deploys.lst\', \'dummy.js\'])');
    data = load(['deploys.lst', 'dummy.js']);
    data.forEach( function(item) {
        g_logger.info('<pre>' + item + '</pre>');
    });
    
    g_logger.info('load([\'deploy.lst\', \'dummy.js\'], onload, onerror)');
    data = load(['deploys.lst', 'dummy.js'], function(data) {
            data.forEach( function(item) {
                g_logger.info('<pre>' + item + '</pre>');
            });
        }, function(error) {
            data.forEach( function(item, ix) {
                if (item instanceof Error) {
                    g_logger.info('<pre>' + ix + ': ' + error.message + '</pre>');
                } else {
                    g_logger.info('<pre>' + ix + ': ' + error + '</pre>');
                }
            });
        
        }
    );

    // var data = load(['deploys.lst', 'dummy.js'], function(result){
    //     g_logger.info(result.map(function(item, ix) { return ix + ': ' + item + ';'; }).join('<br/>'));
    // 
    // }, function(result) {
    //     g_logger.info(result.map(function(item, ix) { return ix + ': ' + (item.message ? item.message : item) + ';'; }).join('<br/>'));
    // 
    // });
}

function requireTest(content) {
    var dummy = require('dummy.js');
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
    var cfg = load('app.cfg');
    g_logger.info('app.name: ' + cfg.app.name);
    g_logger.info('app.title: ' + cfg.app.title);
    g_logger.info('debug is ' + (cfg.app.debug=='0' ? 'off' : 'on'));
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

    //requireTest(content);

    //arrayTest(content);

    //loggerTest(content);

    //parseElementTest(content);
}
