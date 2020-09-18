include('iadapter-ext.js');
(function () {
    function Player() {
        this.sequences = [];
        this.dataBlocks = [];
        this.channels = [];
        this.refreshRate = 25.0;
    };
    extend(Ps.IAdapterExt, Player);

    Player.EOF = 0;
    Player.EOS = 1;
    Player.ASSIGN = 2;
    Player.TEMPO = 3;

    // IAdapter implementation
    Player.prototype.getInfo = function () { return Player.info; };

    Player.prototype.prepareContext = function (data) {
    // #00 device count
    // #01 type of device #0
    // #02 type of device #1
    // ...
    // #0n type of device #n-1
        Player.base.prepareContext.call(this, data);
    };

    Player.prototype.createDeviceImpl = function createDeviceImpl(deviceType, initData) {
        var device = null;
        switch (deviceType) {
            case Ps.Player.Device.PLAYER:
                device = new Ps.Player();
                break;
            case Ps.Player.Device.CHANNEL:
                device = new Ps.Channel(this.devices.length);
                this.channels.push(device);
                break;
        }
        return device;
    };

    Player.prototype.processCommand = function processCommand(device, command, sequence, cursor) {
        switch (command) {
            case Player.ASSIGN:
                var channelId = sequence.getUint8(cursor++);
                var sequenceId = sequence.getUint8(cursor++);
                var deviceId = sequence.getUint8(cursor++);
                var sequence = this.sequences[sequenceId];
                this.channels[channelId].assign(deviceId, sequence);
                break;
            case Player.TEMPO:
                for (var i in Player.adapters) {
                    var adapter = Player.adapters[i];
                    if (typeof adapter.updateRefreshRate === 'function') {
                        adapter.updateRefreshRate(sequence.readFloat32(cursor++));
                    }
                }
                break;
        }
        return cursor;
    };

    Player.prototype.updateRefreshRate = function updateRefreshRate(fps) {
        console.log('Player.updateRefreshRate to ' + fps.toPrecision(4));
    };

    // IAdapterExt implementation
    Player.prototype.makeCommand = function(command)  {
        var stream = new Stream(128);
        stream.writeUint8(command);
        var inputStream = null;
        if (arguments[1] instanceof Ps.Sequence) inputStream = arguments[1].stream;
        else if (arguments[1] instanceof Stream) inputStream = arguments[1];
        switch (command) {
            case Player.ASSIGN:
                if (inputStream) {
                    stream.writeStream(inputStream, arguments[2], 2);
                } else {
                    stream.writeUint8(arguments[1]);
                    stream.writeUint8(arguments[2]);
                }
                break;
            case Player.TEMPO:
                if (inputStream) {
                    stream.writeStream(inputStream, arguments[2], 4);
                } else {
                    stream.writeFloat32(arguments[1]);
                }
                break;
            case Player.EOF:
                stream.writeUint8(Player.EOF);
                break;
            case Player.EOS:
                stream.writeUint8(Player.EOS);
                break;
        }
        return new Stream(stream);
    };

    Player.prototype.runChannels = function runChannels(ticks) {
        for (var i=0; i<this.channels.length; i++) {
            this.channels[i].run(ticks);
        }
        return this.channels[0].isActive;
    };

    Player.prototype.createBinaryData = function createBinaryData() {
        return Player.createBinaryData(
            () => {
                var adapterList = [];
                adapterList.push(0);
                var i = 0;
                for (var id in Object.keys(Player.adapters)) {
                    adapterList.push(id);
                    i++;
                }
                adapterList[0] = i;
                return adapterList;
            },
            () => this.sequences,
            () => this.dataBlocks
        );
    };

    // static members
    Player.adapters = {};
    Player.adapterTypes = {};
    Player.addAdapter = function addAdapter(adapterType) {
        var id = adapterType.getInfo().id;
        var adapter = Player.adapters[id];
        if (!Player.adapterTypes[id]) {
            Player.adapterTypes[id] = adapterType;
            adapter = Player.adapters[id] = Reflect.construct(adapterType, []);
        }
        return adapter;
    };
    Player.createBinaryData = function createBinaryData(createAdapterList, createSequences, createDataBlocks) {
        var data = new Stream(256);

        var adapterList = createAdapterList.call(this);
        var sequences = createSequences.call(this);
        var dataBlocks = createDataBlocks.call(this);

        // create header
        var offset = 2+3*2;
        data.writeUint16(offset);                   // header size
        data.writeUint16(offset);                   // offset of adapter list
        offset += 1 + adapterList.length*2;
        data.writeUint16(offset);                   // offset of sequence table
        offset += 2 + sequences.length*4;
        data.writeUint16(offset);                   // offset of data block table
        offset += 2 + dataBlocks.length*8;

        // write adapter list
        data.writeUint8(adapterList.length);        // adapter count
        for (var i=0; i<adapterList.length; i++) {
            var type = adapterList[i][0];
            if (!this.adapters[type]) {
                throw new Error(`Adapter type '${type}' not found!`);
            }
            data.writeUint8(type);                    // adapter type
            data.writeUint8(adapterList[i][1]);       // id of data block of adapter initialization
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
        data.writeUint16(dataBlocks.length);        // data block count
        for (var i=0; i<dataBlocks.length; i++) {
            data.writeUint32(offset);                 // data block offset
            offset += dataBlocks[i].length;
            data.writeUint32(dataBlocks[i].length);   // data block length
        }

        // write sequences
        for (var i=0; i<sequences.length; i++) {
            data.writeStream(sequences[i].stream);
        }

        // write data blocks
        for (var i=0; i<dataBlocks.length; i++) {
            data.writeStream(dataBlocks[i]);
        }

        return data;
    };

    Player.load = async function load(url) {
        var data = await load(url);
    };

    Player.getInfo = () => Player.info;

    Player.info = {
	    name: 'PlayerAdapter',
	    id: 0
    };
    
    Player.Device = {
        PLAYER: 0,
        CHANNEL: 1
    };

    public(Player, 'Player', Ps);
})();