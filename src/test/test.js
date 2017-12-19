include('frmwrk/fw.js');
include('utils/Logger.js');

include('ge/synth.js');
include('ge/player.js');
include('ge/synthAdapter.js');
include('ge/sound.js');


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
    url = 'https://www.example.com/users/ng210/index.html?k1=v&k2=v2&k3';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = 'https://www.example.com/users/ng210/index.html';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = 'https://www.example.com/users/ng210';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = 'www.example.com/users/ng210';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = '/users/ng210/index.html?k1=v&k2=v2&k3#ressource';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
    url = '../index.html?k1=v&k2=v2&k3#ressource';
    g_logger.info(JSON.stringify(new load.UrlObject(url)));
}

function normalizePathTest() {
    var path = 'dirA/dirB/file.ext';
    g_logger.info(path + ' => ' + load.normalizePath(path));
    path = '../dirA/dirB/file.ext';
    g_logger.info(path + ' => ' + load.normalizePath(path));
    path = '/dirA/dirB/file.ext';
    g_logger.info(path + ' => ' + load.normalizePath(path));
    path = '../dirA/../dirB/file.ext';
    g_logger.info(path + ' => ' + load.normalizePath(path));
    path = 'dirA//dirB/file.ext';
    g_logger.info(path + ' => ' + load.normalizePath(path));
}

function synthTest() {
    var ns_synth = require('/ge/synth.js');
    var ns_player = require('/ge/player.js');
    var SynthAdapter = require('/ge/synthAdapter.js');
    var sound = require('/ge/sound.js');

	var player = new ns_player.Player();
	var mainSeq = [
		new ns_player.Command(   0, ns_player.Cmd_setTempo, [16, 4]),			// set fps to 5, tpf to 1 (makes 5 tps)
		new ns_player.Command(   0, ns_player.Cmd_assign, [0, 1, 1 | 2]),		// connect target #0 with sequence #1 with status active
		new ns_player.Command(1000, ns_player.Cmd_end, null)					// end
	];
	var subSeq1 = [
		new ns_player.Command(   0, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.7]),	//E
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.7]),	//E
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.7]),	//E
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.7]),	//E
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [24, 0.7]),	//C
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [24, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [23, 0.7]),	//H
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [23, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [21, 0.7]),	//A
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [21, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [17, 0.7]),	//F
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [17, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [21, 0.7]),	//A
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [21, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [19, 0.7]),	//G
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [19, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [17, 0.7]),	//F
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [17, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.7]),	//E
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [16, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [14, 0.7]),	//D
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [14, 0.0]),
		new ns_player.Command(   8, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [12, 0.7]),	//C
		new ns_player.Command(  16, SynthAdapter.Cmd_setNote, [12, 0.0]),
		new ns_player.Command(  16, ns_player.Cmd_end, null)
	];
	// the very first sequence is the master that spawns all the channels
	player.addSequence(mainSeq);
	player.addSequence(subSeq1);
	// add synth
	var synth = new ns_synth.Synth(48000);
	synth.setup([
		ns_synth.Ctrl.amp, 0.6,
		ns_synth.Ctrl.Lfo1fre, 5.1,     ns_synth.Ctrl.Lfo1amp, 0.2,	ns_synth.Ctrl.Lfo1wav, ns_synth.WF_SIN,
		ns_synth.Ctrl.Lfo2fre, 7.0,     ns_synth.Ctrl.Lfo2amp, 4.0,	ns_synth.Ctrl.Lfo2wav, ns_synth.WF_SIN,

		ns_synth.Ctrl.Env1atk, 0.01,    ns_synth.Ctrl.Env1dec, 0.01,
		ns_synth.Ctrl.Env1sus, 0.2,     ns_synth.Ctrl.Env1rel, 0.5,
		ns_synth.Ctrl.Env1off, 0.0,     ns_synth.Ctrl.Env1amp, 1.0,

		// ns_synth.Ctrl.Env2atk, 0.0,	ns_synth.Ctrl.Env2dec, 0.05, 
		// ns_synth.Ctrl.Env2sus, 0.5,	ns_synth.Ctrl.Env2rel, 0.5,
		// ns_synth.Ctrl.Env2off, 1.0,	ns_synth.Ctrl.Env2amp, 1.0, 

		ns_synth.Ctrl.Osc1wav, ns_synth.WF_TRI,
		ns_synth.Ctrl.Osc1fre, 0.0,	ns_synth.Ctrl.Osc1amp, 0.6,	ns_synth.Ctrl.Osc1psw, 0.6,
		ns_synth.Ctrl.Osc1tun, 12.0, 
		ns_synth.Ctrl.Osc2wav, ns_synth.WF_TRI,
		ns_synth.Ctrl.Osc2fre, 1.1,	ns_synth.Ctrl.Osc2amp, 0.4,	ns_synth.Ctrl.Osc2psw, 0.3,
		ns_synth.Ctrl.Osc2tun, 24
    ]);
	// add synth adapter
	player.addTarget(synth, new SynthAdapter());

    var frameCounter = 0;
	sound.init(48000, function(buffer, bufferSize) {
        var samplesPerFrame = 48000 / player.refreshRate;
        var start = 0;
        var end = 0;
        var remains = bufferSize;
        while (remains) {
            if (frameCounter == 0) {
                player.run(1);
                frameCounter = samplesPerFrame;
            }
            var len = frameCounter < remains ? frameCounter : remains;
            end = start + len;
            frameCounter -= len;
            synth.run(buffer, start, end);
            start = end;
            remains -= len;
        }
    });

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

    // loadTest(content);

    // urlInfoTest();

    // requireTest(content);

    // arrayTest(content);

    // loggerTest(content);

    // parseElementTest(content);

    // hashTest();

    // normalizePathTest();

    synthTest();
}

