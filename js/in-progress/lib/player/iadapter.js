/******************************************************************************
 * Adapter interface prototype
 *  - should be singleton object
 ******************************************************************************/
include('/lib/data/stream.js');
(function() {
    var Ps = self.Ps || {};
    function IAdapter(player) {
        this.player = player;
        this.devices = [];
    }
    IAdapter.prototype.getInfo = function() { throw new Error('Not implemented!'); };
    IAdapter.prototype.prepareContext = function(data) {
        if (data) {
            var deviceCount = data.readUint8();
            for (var i=0; i<deviceCount; i++) {
                var device = this.createDevice(data.readUint8(), data);
            }
        }
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
    IAdapter.prototype.setRefreshRate = function(fps) {
        for (var i=0; i<this.devices.length; i++) {
            this.devices[i].setRefreshRate(fps);
        }
    };
    IAdapter.prototype.createDeviceImpl = function(deviceType, initData) { throw new Error('Not implemented!'); };
    IAdapter.prototype.processCommand = function(channel, command) { throw new Error('Not implemented!'); };

    IAdapter.prototype.reset = function reset() {
        for (var i=0; i<this.devices.length; i++) {
            this.devices[i].reset();
        }
    };

	IAdapter.prototype.getState = function getState() {
        var state = {
            'devices': []
        };
		for (var i=0; i<this.devices.length; i++) {
            state.devices[i] = this.devices[i].getState();
        }
        return state;
	};
	IAdapter.prototype.setState = function setState(state) {
		for (var i=0; i<this.devices.length; i++) {
            this.devices[i].setState(state.devices[i]);
        }
	};
    // IAdapter.getInfo = function() { throw new Error('Not implemented!'); };
    // IAdapter.create = function(player) { throw new Error('Not Implemented!'); };

    publish(Ps, 'Ps');
    publish(IAdapter, 'IAdapter', Ps);
})();