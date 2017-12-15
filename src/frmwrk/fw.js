include('base/module.js');
include('frmwrk/array.js');
include('frmwrk/map.js');
(function(){
    var fw = {
        Array: require('/frmwrk/array.js'),
        Map: require('/frmwrk/map.js')
    };
    module.exports=fw;
})();

if (typeof onpageload === 'function') window.onload = onpageload;