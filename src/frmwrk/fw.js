include('base/module.js');
include('frmwrk/array.js');
(function(){
    var fw = {
        Array: require('/frmwrk/array.js')
    };
    module.exports=fw;
})();

if (typeof onpageload === 'function') window.onload = onpageload;