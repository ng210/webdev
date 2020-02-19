include('/base/dbg.js');

//var _indentText = ['&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;', '&nbsp;'];
var _indentText = '        ';
var _bulletinSymbols = ['►', '▪', '∙'];

function print(node, indent) {
    if (Array.isArray(node)) {
        for (var i=0; i<node.length; i++) {
            print(node[i], indent+1);
        }
    } else {
        Dbg.prln(`<pre>${_indentText.substr(0, indent)}</pre>${_bulletinSymbols[indent<_bulletinSymbols.length ? indent-1 : _bulletinSymbols.length-1]} ${node}`);
    }
}

function test(lbl, action) {
    var errors = action();
    var result = [lbl + '..' + (errors ? '<span style="color:#ff4040">Failed</span>' : '<span style="color:#40ff40">Ok</span>')];
    if (errors) {
        result.push(errors);
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
            Dbg.prln('<b>Test finished</b>');
        }
    } else {
        Dbg.prln(`Error loading ${module.error}`);
    }
}