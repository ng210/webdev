include('iadapter-ext.js');
(function () {
    function Player() {
        Player.base.constructor.call(this, this);
        this.adapters = {};
        this.sequences = [];
        this.dataBlocks = [];
        this.channels = [];
        this.masterChannel = null;
        this.refreshRate = 25.0;
    };
    extend(Ps.IAdapterExt, Player);

    Player.EOF = 0;
    Player.EOS = 1;
    Player.ASSIGN = 2;
    Player.TEMPO = 3;

    // IAdapter implementation
    Player.prototype.createDeviceImpl = function createDeviceImpl(deviceType, initData) {
        var device = null;
        switch (deviceType) {
            case Ps.Player.Device.PLAYER:
                device = new Ps.Player();
                break;
            case Ps.Player.Device.CHANNEL:
                device = new Ps.Channel('Chn'+this.channels.length);
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
                this.channels[channelId].loopCount = sequence.getUint8(cursor++);
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
                    stream.writeStream(inputStream, arguments[2], 4);
                } else {
                    stream.writeUint8(arguments[1]);    // channel id
                    stream.writeUint8(arguments[2]);    // sequence id
                    stream.writeUint8(arguments[3]);    // device id
                    stream.writeUint8(arguments[4]);    // loop count
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

        stream.buffer = stream.buffer.slice(0, stream.length);
        return stream;
    };

    // Player methods
    Player.prototype.addAdapter = function addAdapter(adapterType) {
        var id = adapterType.getInfo().id;
        var adapter = Reflect.construct(adapterType, [this]);
        this.adapters[id] = adapter;
        return adapter;
    };
    Player.prototype.load = async function load(data) {
        var stream = null;
        if (typeof data === 'string') {
            stream = await Stream.fromFile(url);
        } else if (data instanceof Stream) {
            stream = data;
        }
        // get data blocks
        this.dataBlocks = [];
        var offset = stream.readUint16(6);
        var count = stream.readUint16(offset);
        offset += 2;
        for (var i=0; i<count; i++) {
            this.dataBlocks.push(new Stream(stream, stream.readUint32(offset), stream.readUint32(offset+4)));
            offset += 8;
        }
        // add adapters, prepare context
        this.adapters = {};
        this.adapters[this.getInfo().id] = this;
        this.prepareContext(this.dataBlocks[0]);
        offset = stream.readUint16(2);
        count = stream.readUint8(offset++);
        for (var i=0; i<count; i++) {
            var adapterType = stream.readUint8(offset++);
            var adapter = this.addAdapter(Ps.Player.adapterTypes[adapterType]);
            adapter.prepareContext(this.dataBlocks[stream.readUint8(offset++)]);
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
        var adapter = this.adapters[stream.readUint8(offset)];
        var sequence = new Ps.Sequence(adapter);
        sequence.stream.writeStream(stream, offset+1, length-1);
        return sequence;
    };
    Player.prototype.run = function run(ticks) {
        if (this.channels[0].isActive) {
            for (var i=0; i<this.channels.length; i++) {
                this.channels[i].run(ticks);
            }
        }
        return this.channels[0].isActive;
    };
    Player.prototype.reset = function reset() {
        this.masterChannel.assign(0, this.sequences[0]);
        this.masterChannel.loopCount = 0;
        this.masterChannel.isActive = true;

    };
    Object.defineProperties(Player.prototype, {
        isActive: {
            get() { return this.channels[0].isActive; }
        }
    });

    // static members
    Player.adapterTypes = {};
    Player.registerAdapter = adapterType => Ps.Player.adapterTypes[adapterType.getInfo().id] = adapterType;
    Player.createBinaryData = function createBinaryData(player, createAdapterList, createSequences, createDataBlocks) {
        var data = new Stream(256);

        if (typeof createAdapterList != 'function') createAdapterList = () => player.adapters;
        if (typeof createSequences != 'function') createSequences = () => player.sequences;
        if (typeof createDataBlocks != 'function') createDataBlocks = () => player.dataBlocks;
        var adapterList = createAdapterList.call(this);
        var sequences = createSequences.call(this, player);
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
            if (!player.adapters[type]) {
                throw new Error(`Adapter type '${type}' not found!`);
            }
            data.writeUint8(type);                    // adapter type
            data.writeUint8(adapterList[i][1]);       // id of data block of adapter initialization
        }

        // write sequence table
        data.writeUint16(sequences.length);         // sequence count
        for (var i=0; i<sequences.length; i++) {
            data.writeUint16(offset);               // sequence offset
            var length = 1 + sequences[i].stream.length;
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
            data.writeUint8(sequences[i].adapter.getInfo().id);
            data.writeStream(sequences[i].stream);
        }

        // write data blocks
        for (var i=0; i<dataBlocks.length; i++) {
            data.writeStream(dataBlocks[i]);
        }

        return data;
    };
    Player.create = function create() {
        var player = Reflect.construct(Ps.Player, []);
        // set adapter #0
        player.adapters[player.getInfo().id] = player;
        // set device #0
        player.devices.push(player);
        // crate master channel
        player.masterChannel = player.createDevice(Ps.Player.Device.CHANNEL);
        player.masterChannel.id = 'master';
        player.masterChannel.loopCount = 0;
        player.masterChannel.isActive = true;
        return player;
    };

    Player.getInfo = () => Player.info;
    Player.info = { name: 'PlayerAdapter', id: 0 };
    
    Player.Device = {
        PLAYER: 0,
        CHANNEL: 1
    };

    publish(Player, 'Player', Ps);
})();