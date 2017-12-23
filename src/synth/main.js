include('synth/synthApp.js');

function onpageload(e) {
    var content = document.getElementById('content');
    // g_logger = new Logger({
    //     format: '<small><b>{{level}}</b> - <i>{{file}}::{{method}}</i>({{line}})</small> - ' +
    //             '<tt>{{message}}</tt></br>',
    //             //'<div style="font-size: large; background-color: silver; margin: 0px; padding: 0px"><tt>{{message}}</tt></div>',
    //     level: 'info',  
    //     print: {
    //         context: null,
    //         method: function(data) {
    //             content.innerHTML += data;
    //         }
    //     }
    // });
    SynthApp.init();
}   