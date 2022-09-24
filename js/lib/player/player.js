(function () {
    var Ps = self.Ps || {};
    function Player() {
        this.adapters = [];
        this.sequences = [];
        this.datablocks = [];
        this.masterChannel = null;
        this.refreshRate = 0;
        this.adapter = null;
    };

    Player.prototype.initialize = function initialize() {
        // set adapter #0
        this.adapter = this.addAdapter(Ps.Player.adapterTypes[Ps.PlayerAdapter.info.id].type, 0);
        //this.adapters.push({ adapter:this, datablock:0 });
        // set device #0
        this.adapter.devices.push(this);
        // crate master channel
        this.masterChannel = this.adapter.createDevice(Ps.PlayerAdapter.Device.CHANNEL);
        this.masterChannel.id = 'master';
        this.masterChannel.loopCount = 0;
        this.masterChannel.isActive = true;
    };

    Player.prototype.addAdapter = function addAdapter(adapterType, datablockId) {
        var adapter = Reflect.construct(adapterType, [this]);
        if (!this.adapters.find(x => x.adapter.getInfo().id == adapter.getInfo().id)) {
            this.adapters.push({ adapter:adapter, datablock:datablockId });
        }
        return adapter;
    };
    Player.prototype.load = async function load(data) {
        var stream = null;
        if (typeof data === 'string') {
            stream = await Stream.fromFile(data);
        } else if (data instanceof Stream) {
            stream = data;
        }
        // get data blocks
        this.datablocks = [];
        var offset = stream.readUint16(6);
        var count = stream.readUint16(offset);
        offset += 2;
        for (var i=0; i<count; i++) {
            var s = new Stream(stream, stream.readUint32(offset), stream.readUint32(offset+4));
            this.datablocks.push(s);
            offset += 8;
        }
        // add adapters, prepare context
        this.adapters.length = 1;
        if (!this.adapter) {
            this.adapter = this.addAdapter(Ps.PlayerAdapter, 0);
        }
        await this.adapter.prepareContext(this.datablocks[0]);
        offset = stream.readUint16(2);
        count = stream.readUint8(offset++);
        for (var i=0; i<count; i++) {
            var adapterTypeId = stream.readUint8(offset++);
            var datablockId = stream.readUint8(offset++);
            var adapter = this.addAdapter(Ps.Player.adapterTypes[adapterTypeId].type, datablockId);
            await adapter.prepareContext(this.datablocks[datablockId]);
        }
        // create sequences
        this.sequences = [];
        count = stream.readUint16(offset);
        offset += 2;
        for (var i=0; i<count; i++) {
            var start = stream.readUint16(offset);
            var length = stream.readUint16(offset+2);
            this.sequences.push(this.createSequence(stream, start, length));
            offset += 4;
        }

        // assign master channel
        this.masterChannel.assign(0, this.sequences[0]);
    };
    Player.prototype.createSequence = function createSequence(stream, offset, length) {
        var adapterInfo = this.adapters.find(x => x.adapter.getInfo().id == stream.readUint8(offset));
        if (adapterInfo) {
            var sequence = new Ps.Sequence(adapterInfo.adapter);
            sequence.stream.writeStream(stream, offset, length);
        }
        return sequence;
    };
    Player.prototype.run = function run(ticks) {
        if (this.masterChannel.isActive) {
            this.adapter.run(ticks);
        }
        return this.masterChannel.isActive;
    };
    Player.prototype.reset = function reset() {
        for (var i=1; i<this.adapters.length; i++) {
            this.adapters[i].adapter.reset();
        }
        if (this.sequences.length > 0) {
            this.masterChannel.currentTick = 0;
            this.masterChannel.assign(0, this.sequences[0]);
            this.masterChannel.loopCount = 0;
            this.masterChannel.isActive = true;
        } else {
            this.masterChannel.isActive = false;
        }
    };
    Player.prototype.restart = function restart() {
        this.masterChannel.assign(0, this.sequences[0]);
        this.masterChannel.loopCount = 0;
        this.masterChannel.isActive = true;
    };
    Player.prototype.getState = function getState() {
        var state = {
            'refreshRate': this.refreshRate,
            'adapters': {}
        };
        for (var i=0; i<this.adapters.length; i++) {
            var adapter = this.adapters[i].adapter;
            state.adapters[adapter.getInfo().name] = adapter.getState();
        }
        return state;
    };
    Player.prototype.setState = function setState(state) {
        for (var i in state.adapters) {
            var adapter = this.adapters.find(x => x.getInfo().name == i);
            if (adapter) {
                adapter.setState(state.adapters[i]);
            } else {
                throw new Error(`Adapter '${i}' not found!`);
            }
        }
        var refreshRate = state.refreshRate;
        if (refreshRate != this.refreshRate) {
            this.setRefreshRate(state.refreshRate);
        }
    };

    Player.prototype.setRefreshRate = function setRefreshRate(fps) {
        for (var i=0; i<this.adapters.length; i++) {
            this.adapters[i].adapter.setRefreshRate(fps);
        }
        this.refreshRate = fps;
    };

    Object.defineProperties(Player.prototype, {
        isActive: {
            get() { return this.masterChannel.isActive; }
        }
    });

    //#region static members
    Player.adapterTypes = {};
    Player.registerAdapter = function(adapterType) {
        var adapter = Reflect.construct(adapterType, [null]);
        var info = adapter.getInfo();
        if (!Ps.Player.adapterTypes[info.id]) {
            if (typeof adapterType.initialize === 'function') {
                adapterType.initialize();
            }
            Ps.Player.adapterTypes[info.id] = {
                'name': info.name,
                'type': adapterType,
                'adapter': adapter
            };
        }
    };
    Player.getAdapterType = function getAdapterType(typeName) {
        var adapterType = null;
        for (var i in Ps.Player.adapterTypes) {
            if (Ps.Player.adapterTypes[i].name == typeName) {
                adapterType = Ps.Player.adapterTypes[i];
                break;
            }
        }
        return adapterType.type;
    }
    Player.createBinaryData = function createBinaryData(player, createAdapterList, createSequences, createDataBlocks) {
        var data = new Stream(256);
        if (typeof createAdapterList != 'function') createAdapterList = () => player.adapters;
        if (typeof createSequences != 'function') createSequences = () => player.sequences;
        if (typeof createDataBlocks != 'function') createDataBlocks = () => player.datablocks;
        var adapterList = createAdapterList.call(this);
        var sequences = createSequences.call(this, player);
        var datablocks = createDataBlocks.call(this);

        // create header
        var offset = 2+3*2;
        data.writeUint16(offset);                   // header size
        data.writeUint16(offset);                   // offset of adapter list
        offset += 1 + (adapterList.length-1)*2;
        data.writeUint16(offset);                   // offset of sequence table
        offset += 2 + sequences.length*4;
        data.writeUint16(offset);                   // offset of data block table
        offset += 2 + datablocks.length*8;

        // write adapter list
        data.writeUint8(adapterList.length - 1);    // adapter count
        for (var i=1; i<adapterList.length; i++) {  // skip first as it is ALWAYS the Player
            var type = adapterList[i].adapter;
            if (!player.adapters.find(x => x.adapter == type)) {
                throw new Error(`Adapter type '${type}' not found!`);
            }
            data.writeUint8(type.getInfo().id);              // adapter type
            data.writeUint8(adapterList[i].datablock);       // id of data block of adapter initialization
        }

        // write sequence table
        data.writeUint16(sequences.length);         // sequence count
        for (var i=0; i<sequences.length; i++) {
            data.writeUint16(offset);               // sequence offset
            var length = sequences[i].stream.length;
            offset += length;
            data.writeUint16(length);               // sequence length
        }
        // write data block table
        data.writeUint16(datablocks.length);        // data block count
        for (var i=0; i<datablocks.length; i++) {
            data.writeUint32(offset);                 // data block offset
            offset += datablocks[i].length;
            data.writeUint32(datablocks[i].length);   // data block length
        }

        // write sequences
        for (var i=0; i<sequences.length; i++) {
            //data.writeUint8(sequences[i].adapter.getInfo().id);
            data.writeStream(sequences[i].stream);
        }

        // write data blocks
        for (var i=0; i<datablocks.length; i++) {
            data.writeStream(datablocks[i]);
        }

        data.buffer = data.buffer.slice(0, data.length);
        return data;
    };
    Player.create = function create() {
        Ps.Player.registerAdapter(Ps.PlayerAdapter);
        var player = Reflect.construct(Ps.Player, []);
        player.initialize();
        return player;
    };
    //#endregion

    publish(Ps, 'Ps');
    publish(Player, 'Player', Ps);
})();