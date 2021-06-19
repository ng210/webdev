fs = require('fs');

const PATH = 'D:\\G\\OldGames\\UFO2\\GAME_2';

var directions = ['W', 'NE', 'S', 'SE', 'E', 'SW', 'N', 'NW'];
var allyTypes = [0,1,2,3,15,16];

function print(data, length, isRight, padding) {
    var text = data.toString();
    padding = padding || ' ';
    var buffer = Buffer.allocUnsafe(length);
    var preLength = length - text.length;
    var j = 0;
    for (var i=0; i<length; i++) {
        if (!isRight) {
            buffer[i] = i < text.length ? text.charCodeAt(i) : padding.charCodeAt(0);
        } else {
            buffer[i] = i < preLength ? padding.charCodeAt(0) : text.charCodeAt(j++);
        }
        
    }
    return buffer.toString('utf-8');
}

function Soldier() {
    // unit ref
    this.type = null;
    this.rank = null;
    this.heading = null;
    this.time = null;
    this.health = null;
    this.shok = null;
    this.energy = null;
    this.reaction = null;
    this.strength = null;
    this.armour = null;
    this.firing = null;
    this.throwing = null;
    this.timemax = null;
    this.healthmax = null;
    this.energymax = null;
    this.reactionsmax = null;
    this.armourmax = null;
    this.mcskill = null;
    this.corpse_icon = null
    this.unitnum = null;
    this.unk3 = null;
    this.alienrank = null;
    this.lefthand = null;
    this.righthand = null;
    this.mcstrength = null;
    this.morale = null;
    this.bravery = null;
    this.fatal = null;
    this.name = '';

    // unit pos
    this.row = null;
    this.col = null;
    this.lvl = null;
    this.sighted = null;
    this.loyalty = null;
    this.visible = null;
};

Soldier.prototype.readRef = function readRef(buf, pos) {
    this.refPos = pos;
    this.type = buf.readUInt8(pos++);
    this.rank = buf.readUInt8(pos++);
    // skip unk0[8]
    pos += 8;
    this.heading = buf.readUInt8(pos++);
    pos++;
    this.time = buf.readUInt8(pos++);
    this.health = buf.readUInt8(pos++);
    this.shok = buf.readUInt8(pos++);
    this.energy = buf.readUInt8(pos++);
    this.reaction = buf.readUInt8(pos++);
    this.strength = buf.readUInt8(pos++);
    this.armour = new Uint8Array(buf.slice(pos, pos+5)); pos += 5;
    this.firing = buf.readUInt8(pos++);
    this.throwing = buf.readUInt8(pos++);
    this.timemax = buf.readUInt8(pos++);
    this.healthmax = buf.readUInt8(pos++);
    this.energymax = buf.readUInt8(pos++);
    this.reactionsmax = buf.readUInt8(pos++);
    this.armourmax = new Uint8Array(buf.slice(pos, pos+5)); pos += 5;
    // skip unk1[3]
    pos += 3;
    this.mcskill = buf.readUInt8(pos++);
    this.corpse_icon = buf.readUInt8(pos++);
    // skip unk2
    pos++;
    this.unitnum = buf.readUInt8(pos++);
    // skip unk3
    pos++;
    this.alienrank = buf.readUInt8(pos++);
    // skip unk4[10]
    pos += 10;
    this.lefthand = buf.readUInt8(pos++);
    this.righthand = buf.readUInt8(pos++);
    // skip unk5[2]
    pos += 2;
    this.mcstrength = buf.readUInt8(pos++);
    this.morale = buf.readUInt8(pos++);
    this.bravery = buf.readUInt8(pos++);
    // skip unk6[3]
    pos += 3;
    this.fatal = new Uint8Array(buf.slice(pos, pos+6)); pos += 6;
    // skip unk7[17]
    pos += 17;
    var p2 = pos;
    var ch = null;
    while ((ch = buf.readUInt8(p2++)) != 0) {
        this.name += String.fromCharCode(ch);
    }
    pos += 26;
    // skip unk8[20]
    pos += 20;
    return pos;
};

Soldier.prototype.writeRef = function readRef(buf) {
    var pos = this.refPos;
    buf.writeUInt8(this.type, pos++);
    buf.writeUInt8(this.rank, pos++);
    // skip unk0[8]
    pos += 8;
    buf.writeUInt8(this.heading, pos++);
    pos++;
    buf.writeUInt8(this.time, pos++);
    buf.writeUInt8(this.health, pos++);
    buf.writeUInt8(this.shok, pos++);
    buf.writeUInt8(this.energy, pos++);
    buf.writeUInt8(this.reaction, pos++);
    buf.writeUInt8(this.strength, pos++);
    for (var i=0; i<this.armour.byteLength; i++) buf.writeUInt8(this.armour[i], pos++);
    buf.writeUInt8(this.firing, pos++);
    buf.writeUInt8(this.throwing, pos++);
    buf.writeUInt8(this.timemax, pos++);
    buf.writeUInt8(this.healthmax, pos++);
    buf.writeUInt8(this.energymax, pos++);
    buf.writeUInt8(this.reactionsmax, pos++);
    for (var i=0; i<this.armourmax.byteLength; i++) buf.writeUInt8(this.armourmax[i], pos++);
    // skip unk1[3]
    pos += 3;
    buf.writeUInt8(this.mcskill, pos++);
    buf.writeUInt8(this.corpse_icon, pos++);
    // skip unk2
    pos++;
    buf.writeUInt8(this.unitnum, pos++);
    // skip unk3
    pos++;
    buf.writeUInt8(this.alienrank, pos++);
    // skip unk4[10]
    pos += 10;
    buf.writeUInt8(this.lefthand, pos++);
    buf.writeUInt8(this.righthand, pos++);
    // skip unk5[2]
    pos += 2;
    buf.writeUInt8(this.mcstrength, pos++);
    buf.writeUInt8(this.morale, pos++);
    buf.writeUInt8(this.bravery, pos++);
    // skip unk6[3]
    pos += 3;
    for (var i=0; i<this.fatal.byteLength; i++) buf.writeUInt8(this.fatal[i], pos++);
    // skip unk7[17]
    pos += 17;
    for (var i=0; i<this.name.length; i++) buf.writeUInt8(this.name.charCodeAt(i), pos++);
    buf.writeUInt8(0, pos++);
    // skip unk8[20]
    pos += 20;
    return pos;
};

Soldier.prototype.readPos = function readPos(buf, pos) {
    this.posPos = pos;
    this.row = buf.readUInt8(pos++);
    this.col = buf.readUInt8(pos++);
    this.lvl = buf.readUInt8(pos++);
    // skip unk0[5]
    pos += 5;
    this.sighted = buf.readUInt8(pos++);
    this.loyalty = buf.readUInt8(pos++);
    this.visible = buf.readUInt8(pos++);
    // skip unk1[3]
    pos += 3;
    return pos;
};

Soldier.prototype.writePos = function writePos(buf) {
    var pos = this.posPos;
    buf.writeUInt8(this.row, pos++);
    buf.writeUInt8(this.col, pos++);
    buf.writeUInt8(this.lvl, pos++);
    // skip unk0[5]
    pos += 5;
    buf.writeUInt8(this.sighted, pos++);
    buf.writeUInt8(this.loyalty, pos++);
    buf.writeUInt8(this.visible, pos++);
    // skip unk1[3]
    pos += 3;
    return pos;
};

Soldier.prototype.toString = function toString() {
    var status = [
        `name: ${print(this.name, 26, 0, '.')}`,
        `type:${print(this.type, 2, true)}`,
        `health:${print(this.health, 3, true)}/${print(this.healthmax, 3, true)}`,
        `status:${print(this.morale, 3, true)}|${print(this.shok, 3, true)}`,
        `position: [${print(this.row, 3, 1)},${print(this.col, 3, 1)},${print(this.lvl, 2, 1)},${directions[this.heading]}]`,
        `(${print(this.posPos.toString(16), 4, 1, '.')}, ${print(this.refPos.toString(16), 4, 1, '.')})`
    ]
    return status.join(' ');
    
};

function getCommands() {
    var commands = [];
    for (var i=0; i<process.argv.length; i++) {
        var tokens = process.argv[i].split(':');
        switch (tokens[0]) {
            case '-m':   // move unit
                var coors = tokens[1].split(',');
                commands.push({
                    'type': 'move',
                    'unit': coors[0]-1,
                    'x': coors[1],
                    'y': coors[2],
                    'z': coors[3]
                });
                break;
            case '-h':  // set status (health, morale, shok)
                commands.push({ 'type': 'health' });
                break;
            case '-k':  // kill enemies
                commands.push({ 'type': 'health', 'kill':true })
                break;
            case '-v':  // set enemy's heading
                commands.push( { 'type': 'heading', 'direction':tokens[1].toUpperCase() })
                break;
            case '-a':  // prepare attack
                commands.push({ 'type': 'health', 'silent':true });
                var args = tokens[1].split(',');
                if (args.length > 2) {
                    var units = args[0].split('-');
                    var unit0 = parseInt(units[0]) - 1, unitN = parseInt(units[1]) - 1;
                    var x = parseInt(args[1]), y = parseInt(args[2]), z = parseInt(args[3]);
                    if (z == undefined) z = 3;
                    if (args.length == 5) {
                        var heading = args[4];
                        commands.push( { 'type': 'heading', 'direction':heading.toUpperCase(), 'silent':true });
                    };
                    var range = unitN - unit0 + 1;
                    var width = Math.ceil(Math.sqrt(range));
                    var w = 0;
                    for (var i=0; i<range; i++) {
                        commands.push({
                            'type': 'move',
                            'unit': unit0 + i,
                            'x': x,
                            'y': y + w,
                            'z': z
                        });
                        if (++w == width) {
                            w = 0; x++;
                        }
                    }
                }
                break;
        }
    }
    return commands;
}

function main() {
    var unitRef = fs.readFileSync(PATH + '\\unitref.dat');
    var unitPos = fs.readFileSync(PATH + '\\unitpos.dat');
    var commands = getCommands();
    console.log('\n*** UNITS **************************************************');
    // create list of units
    var units = [];
    var activeUnits = [];
    try {
        var refPos = 0;
        var posPos = 0;
        var id = 0;
        while (refPos < unitRef.byteLength && posPos < unitPos.byteLength) {
            var soldier = new Soldier();
            refPos = soldier.readRef(unitRef, refPos);
            posPos = soldier.readPos(unitPos, posPos);
            units.push(soldier);
            if (allyTypes.includes(soldier.type) || soldier.health > 0 && soldier.energy > 0) {
                id++;
                console.log(`#${('00' + id).slice(-2)}: ${soldier.toString()}`);
                activeUnits.push(soldier);
            }
            // console.log(`${refPos}/${unitRef.byteLength}, ${posPos}/${unitPos.byteLength}`);
        }
        if (commands.length > 0) {
            console.log('\n*** COMMANDS *************************************');
            for (var i=0; i<commands.length; i++) {
                var cmd = commands[i];
                switch (cmd.type) {
                    case 'move':
                        var unit = activeUnits[cmd.unit];
                        if (unit) {
                            if (cmd.x != undefined) unit.row = cmd.x;
                            if (cmd.y != undefined) unit.col = cmd.y;
                            if (cmd.z != undefined) unit.lvl = cmd.z;
                            if (!cmd.silent) console.log(`${unit.name} moved to ${unit.row},${unit.col},${unit.lvl}.`)
                        }
                        break;
                    case 'health':
                        for (var j=0; j<units.length; j++) {
                            var unit = units[j];
                            if (allyTypes.includes(unit.type)) {
                                unit.health = unit.healthmax;
                                unit.morale = 100;
                                unit.shok = 0;
                                if (!cmd.silent) console.log(`${unit.name} health restored to ${unit.health}.`)
                            } else if (unit.health > 0) {
                                unit.health = cmd.kill ? 0 : Math.floor((0.09*Math.random() + 0.01)*unit.healthmax);
                                if (!cmd.silent) console.log(`${unit.name} health reduced to ${unit.health}.`)
                            }
                        }
                        break;
                    case 'heading':
                        for (var j=0; j<activeUnits.length; j++) {
                            var unit = activeUnits[j];
                            if (!allyTypes.includes(unit.type)) {
                                var dir = cmd.direction;
                                if (isNaN(cmd.direction)) {
                                    dir = directions.indexOf(cmd.direction);
                                    if (dir == -1) continue;
                                }
                                unit.heading = dir;
                                if (!cmd.silent) console.log(`${unit.name} heading to ${unit.heading}.`)
                            }
                        }
                }
            }

            for (var i=0; i<units.length; i++) {
                units[i].writeRef(unitRef);
                units[i].writePos(unitPos);
            }
            // export data
            fs.writeFileSync(PATH + '\\unitref.dat', unitRef);
            fs.writeFileSync(PATH + '\\unitpos.dat', unitPos);
        }
    } catch (err) {
        console.error(err);
    }
}

main();