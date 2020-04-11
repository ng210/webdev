include('/base/dbg.js');

//var _indentText = ['&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;'];
var _indentText = '        ';
var _bulletinSymbols = ['►', '▪', '∙'];
var _pending = 0;

function formatResult(value, indent) {
    return `<pre>${_indentText.substr(0, indent)}</pre>${_bulletinSymbols[indent<_bulletinSymbols.length ? indent-1 : _bulletinSymbols.length-1]} ${value}`;
}

function print(node, indent) {
    if (node instanceof Promise) {
        var p = node;
        var lbl = p.lbl;
        p.then( value => {
            var text = '' ;
            if (Array.isArray(value) && value.length) {
                text += '<span style="color:#ff4040">Failed</span><br/>'
                text += formatResult(value, indent);
            } else {
                text += '<span style="color:#40ff40">Ok</span>';
            }
            Dbg.con.innerHTML = Dbg.con.innerHTML.replace(`${lbl}..pending.`, `${lbl}..${text}`);
            _pending--;
        });

    } else if (Array.isArray(node)) {
        for (var i=0; i<node.length; i++) {
            print(node[i], indent+1);
        }
    } else {
        Dbg.prln(formatResult(node, indent));
    }
}

function test(lbl, action) {
    var errors = action();
    var result = '';
    if (errors instanceof Promise) {
        var p = errors;
        p.lbl = lbl;
        _pending++;
        result = [`${lbl}..pending.`];
    } else {
        result = [lbl + '..' + (Array.isArray(errors) && errors.length ? '<span style="color:#ff4040">Failed</span>' : '<span style="color:#40ff40">Ok</span>')];
    }
    if (errors) {
        result.push([errors]);
    }
    return result;
}

async function onpageload(errors) {
    Dbg.init('con');
    Dbg.prln('Tests 0.1');
    Dbg.con.style.visibility = 'visible';

    var url = new Url(location.href);
    var testUrl = new Url(`${url.fragment}/test.js`);
    Dbg.prln(`Load '${testUrl}'`);
    var module = await load(testUrl.toString());
    await load(new Url(`${url.fragment}/test.css`).toString());
    if (module && module.error == null && module.symbols != null) {
        var testName = Object.keys(module.symbols)[0];
        var test = module.symbols[testName];
        if (typeof test === 'function') {
            Dbg.prln(`<b>Running '<i>${testName}</i>'...</b>`);
            print(await test(), -1);
            poll( () => {
                if (_pending == 0) {
                    Dbg.prln('<b>Test finished</b>');
                    return true;
                }
            }, 100);            
        }
    } else {
        Dbg.prln(`Error loading ${module.error}`);
    }
}