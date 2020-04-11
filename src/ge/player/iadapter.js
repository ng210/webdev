/******************************************************************************
 * Adapter interface prototype
 *  - should be singleton object
 ******************************************************************************/
(function() {
    var Ps = window.Ps || {};
    function IAdapter() {}
    IAdapter.prototype.getInfo = function() { throw new Error('Not implemented!'); };
    IAdapter.prototype.registerCommands = function(registry) { throw new Error('Not implemented!'); };
    IAdapter.prototype.prepareContext = function(data) { throw new Error('Not implemented!'); };
    IAdapter.prototype.createDevice = function(deviceId, initData) { throw new Error('Not implemented!'); };
    IAdapter.prototype.processCommand = function(device, command, sequence, cursor) { throw new Error('Not implemented!'); };
    IAdapter.prototype.updateRefreshRate = function(target, command) { throw new Error('Not implemented!'); };

    public(Ps, 'Ps');
    public(IAdapter, 'IAdapter', Ps);
})();