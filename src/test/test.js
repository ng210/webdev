include('frmwrk/fw.js');

if (typeof onpageload === 'function') window.onload = onpageload;

function onpageload(e) {
    var content = document.getElementById('content');

    var dummy = require('dummy.js');
    dummy.func1();
    content.innerHTML += '<hr/>';

    var data = load('deploy.lst', function(data){
        content.innerHTML += 'Data: ' + data.replace(/\n/g, '<br/>');
        content.innerHTML += '<hr/>';
    }, function(error) {
        content.innerHTML += 'Error: ' + error.message;
        content.innerHTML += '<hr/>';
    });

    var data = load(['deploys.lst', 'dummy.js'], function(result){
        content.innerHTML += result.map(function(item, ix) { return ix + ': ' + item + ';'; }).join('<br/>');
        content.innerHTML += '<hr/>';
    }, function(result) {
        content.innerHTML += result.map(function(item, ix) { return ix + ': ' + (item.message ? item.message : item) + ';'; }).join('<br/>');
        content.innerHTML += '<hr/>';
    });

    var arr = new fw.Array();
    arr.push('alma');
    arr.push('szilva');
    content.innerHTML += 'arr.class = ' + arr.getClass() + '<br/>';
}
