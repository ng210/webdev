include('frmwrk/module.js');
include('frmwrk/ajax.js');
include('frmwrk/load.js');

var fw = {
    Array: require('../frmwrk/array.js')
};

if (typeof onpageload === 'function') window.onload = onpageload;