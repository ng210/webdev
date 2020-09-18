/******************************************************************************
 * Adapter interface prototype
 *  - should be singleton object
 ******************************************************************************/
include('data/stream.js');
(function() {
    var Ps = window.Ps || {};
    function IAdapter() {
        this.devices = [];
    }
    IAdapter.getInfo = function() { throw new Error('Not implemented!'); };
    IAdapter.prototype.getInfo = function() { return this.constructor.getInfo(); };
    //IAdapter.prototype.registerCommands = function(registry) { throw new Error('Not implemented!'); };
    IAdapter.prototype.prepareContext = function(data) {
        if (data) {
            data.readPosition = 0;
            var deviceCount = data.readUint8();
            for (var i=0; i<deviceCount; i++) {
                var device = this.createDevice(data.readUint8(), data);
                this.devices.push(device);
            }
        }
    };
    IAdapter.prototype.createDeviceImpl = function(deviceType, initData) {
        throw new Error('Not implemented!');
    };
    IAdapter.prototype.createDevice = function(deviceType, initData) {
        var device = this.createDeviceImpl(deviceType, initData);
        if (device != null) {
            device.type = deviceType;
            this.devices.push(device);
        }
        return device;
    };        
    IAdapter.prototype.getDevice = function getDevice(id) { return this.devices[id]; }
    IAdapter.prototype.processCommand = function(device, command, sequence, cursor) { throw new Error('Not implemented!'); };
    IAdapter.prototype.updateRefreshRate = function(fps) {
        for (var i=0; i<this.devices.length; i++) {
            this.devices[i].updateRefreshRate(fps)
        }
    };

    public(Ps, 'Ps');
    public(IAdapter, 'IAdapter', Ps);
})();