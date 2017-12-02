"use strict";

(function(){
    function Logger(options) {
        this.counter = 0;
        this.level = 4;
        this.format = '#{{counter}} {{level}} - {{file}}::{{method}}({{line}}): {{message}}';
        this.timestampFormat = 'yyyy-MM-dd hh:mm:ss.fff';
        this.preprocess = null;
        this.print = {
            context: null,
            method: function(data) {
                console.log(data);
            }
        };
        if (options) {
            if (typeof options.format === 'string' && options.format.length > 0) {
                this.format = options.format;
            }
            if (typeof options.timestampFormat === 'string' && options.timestampFormat.length > 0) {
                this.timestampFormat = options.timestampFormat;
            }
            if (options.preprocess && typeof options.preprocess.method === 'function') {
                this.preprocess = options.preprocess;
            }
            if (options.level != undefined) {
                this.setLevel(options.level);
            }
            if (options.print && typeof options.print.method === 'function') {
                this.print = options.print;
            }
        }
    }
    Logger.separator = '/';  //__filename.indexOf('\\') != -1 ? '\\' : '/';
    Logger.levels = [ 'LOG', 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE' ];

    Logger.prototype.setLevel = function(lvl) {
        var l = 0;
        if (typeof lvl === 'string') {
            l = Logger.levels.indexOf(lvl.toUpperCase());
            if (l == -1) {
                l = parseInt(lvl);
            }
        } else if (typeof lvl === 'number') {
            l = lvl;
        }
        if (!isNaN(l) && l>=0 && l<=Logger.levels.length) {
            this.level = l;
        }
    };
    Logger.prototype.getLevel = function() {
        return Logger.levels[this.level];
    };
    Logger.prototype.formatDate = function(d) {
        if (this.timestampFormat == null) {
            return d.toLocaleString();
        } else {
            var output = this.timestampFormat;
            var month = d.getMonth()+1;
            var day = d.getDate();
            var hour = d.getHours();
            var min = d.getMinutes();
            var sec = d.getSeconds();
            var ms = d.getMilliseconds();
            var tokens = {
                'yyyy': d.getFullYear(),
                'MM': month > 9 ? month : '0' + month,
                'dd': day > 9 ? day : '0' + day,
                'hh': hour > 9 ? hour : '0' + hour,
                'mm': min > 9 ? min : '0' + min,
                'ss': sec > 9 ? sec : '0' + sec,
                'fff': ('000'+ms).slice(-3)
            };
            for (var k in tokens) {
                output = output.replace(k, tokens[k]);
            }
        }
        return output;
    };
    Logger.prototype.prepareStack = function() {
        var err = new Error();
        // STACK: [0]'Error', [1]prepareStack, [2]prepareOutput [3]log_, [4]trace/debug/info/error, [5]<caller>
        var rows = err.stack.split('\n');
        var row = rows[0].startsWith('Error') ? rows[5] : rows[4];
        // Ch: at loggerTest (test.out.js:240)
        var tokens = row.match(/\s*at\s+([^\(]+)\(([^:]+):(\d+)/);
        if (tokens == null) {
            // E: at loggerTest (http://localhost:8080/test/test.out.js:240:9)
            tokens = row.match(/\s*at\s+([^\(]+)\(.+\/([^\/:]+):(\d+):\d+\)$/);
        }
        if (tokens == null) {
            // FF: loggerTest@http://localhost:8080/test/test.out.js:240:9
            tokens = row.match(/\s*([^\(]+)@.+\/([^\/:]+):(\d+):\d+$/);
        }
        // 0: matched part, 1: method, 2: fullPath, 3: line
        var data = null;
        if (tokens != null) {
            var fullPath = tokens[2].split(Logger.separator);
            var data = {
                method: tokens[1].trim(),
                file: fullPath.pop().trim(),
                path: '',
                line: tokens[3].trim()
            };
            data.path = fullPath.join(Logger.separator);
        } else {
            data = {
                method: '',
                file: '',
                path: row,
                line: ''
            };
        }
        return data;
    };
    Logger.prototype.prepareOutput = function(lvl, txt) {
        var data = this.prepareStack();
        data.timestamp = this.formatDate(new Date());
        data.level = Logger.levels[lvl];
        data.message = txt;
        data.counter = this.counter < 1000 ? ('0000' + this.counter).slice(-4) : this.counter;
        this.counter++;
        if (this.preprocess != null) {
            this.preprocess.method.call(this.preprocess.context, data);
        }
        var output = this.format;
        for (var i in data) {
            output = output.replace(`{{${i}}}`, data[i]);
        }
        return output;
    };
    Logger.prototype.log_ = function(lvl, txt) {
        if (this.level <= lvl) {
            var output;
            try {
                output = this.prepareOutput(lvl, txt);
            } catch(ex) {
                output = ` *** Logging error ${ex.message} while logging '${txt}'.`;
            }
            this.print.method.call(this.print.context, output);
        }
    };

    Logger.prototype.log = function(msg) {
        this.log_(0, msg);
    };
    Logger.prototype.trace = function(msg) {
        this.log_(1, msg);
    };
    Logger.prototype.debug = function(msg) {
        this.log_(2, msg);
    };
    Logger.prototype.info = function(msg) {
        this.log_(3, msg);
    };
    Logger.prototype.warn = function(msg) {
        this.log_(4, msg);
    };
    Logger.prototype.error = function(msg) {
        this.log_(5, msg);
    };

    module.exports = Logger;
})();