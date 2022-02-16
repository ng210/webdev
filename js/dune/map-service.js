function MapService() {
    this.noise = new Noise(42);
    this.width = 0;
    this.height = 0;
    this.data = null;
    this.normalize = true;
    this.levels = 6;
    this.elevation = -0.2;
    this.shadeMode = false;
}

MapService.prototype.create = function create(width, height) {
    width = width || this.width || 100;
    height = height || this.height || 100;
    this.width = width;
    this.height = height;
    this.data = new Array(this.width * this.height);
    var data = new Array(this.data.length);

    // generate noise
    this.noise.transform2d = (x, y, v, buffer, ix) => { buffer[ix] = v < 1 ? v : 1; return ix+1; };
    this.noise.createFbm2d(width, height, 32, 24, 3, 0.94, 1.07, 0.51, 1.17, this.data);

    if (this.normalize) {
        var min = 1, max = 0;
        var ix = 0;
        for (var y=0; y<this.height; y++) {
            for (var x=0; x<this.width; x++) {
                var v = this.data[ix++];
                if (v < min) min = v;
                if (v > max) max = v;
            }
        }
        ix = 0;
        var range = max - min;
        for (var y=0; y<this.height; y++) {
            for (var x=0; x<this.width; x++) {
                var v = this.data[ix];
                this.data[ix] = (v - min)/range + this.elevation;
                ix++;
            }
        }
    }

    //#region quantize
    ix = 0;
    for (var y=0; y<this.height; y++) {
        for (var x=0; x<this.width; x++) {
            var v = this.data[ix];
            if (v >= 1) v = 0.99;
            else if (v < 0) v = 0;
            v = Math.trunc(v * this.levels);
            if (this.shadeMode) {
                v = Math.trunc(255*v/(this.levels-1));
            }
            this.data[ix] = v;
            data[ix] = v;
            ix++;
        }
    }
    //#endregion

    if (!this.shadeMode) {
        //#region adjust tile types according to edges
        ix = 0;
        var miss = {};
        for (var y=0; y<this.height; y++) {
            for (var x=0; x<this.width; x++) {
                var isbug = x==-1&&y==8;
                var code = 0, p2 = 1;
                var value = this.data[ix];
                var ix2 = ix - this.width - 1;
                if (isbug) debugger
                for (var j=-1; j<2; j++) {
                    var dy = y + j;
                    var dbg = [];
                    for (var i=-1; i<2; i++) {
                        var dx = x + i;
                        if (i != 0 || j != 0) {
                            var v2 = this.data[ix2];
                            if (dy < 0 || dy >= this.height || dx < 0 || dx >= this.width) {
                                v2  = value;
                            } 
                            var f = 0;
                            dbg.push(v2)
                            //if (v2 == value) f = 1;
                            if (v2 < 2 && v2 <= value) f = 1;
                            if (v2 > 2 && v2 >= value) f = 1;
                            if (v2 == 2 && value == 2) f = 1;
                            code += p2 * f;
                            p2 <<= 1;
                        } else dbg.push(value)
                        ix2++;
                    }
                    ix2 += this.width - 3;
                    if (isbug) console.log(dbg)
                }
                if (isbug) console.log(code)
                if (value == 2) {
                    value = 82;
                    if (code == 255) {
                        var v1 = Math.random(); //this.data[value % this.data.length];
                        if (v1 < 0.01) value = v % 2 + 80;
                    }
                } else {
                    if (value > 2) value--;
                    value *= 16;
                    switch (code) {
                    //   1    2    4
                    //   8    x   16
                    //  32   64  128
                        //#region full 15
                        case 37:
                        case 90:
                        case 91:
                        case 94:
                        case 122:
                        case 133:
                        case 129:
                        case 218:
                        case 95:
                        case 123:
                        case 219:
                        case 126:
                        case 222:
                        case 127:
                        case 161:
                        case 164:
                        case 165:
                        case 223:
                        case 251:
                        case 250:
                        case 254:
                        case 255:
                        value += 15; break;
                        //#endregion
                        //#region top-bottom 5
                        case 66:
                        case 67:
                        case 70:
                        case 98:
                        case 102:
                        case 194:
                        case 71:
                        case 99:
                        case 195:
                        case 198:
                        case 103:
                        case 199:
                        case 226:
                        case 227:
                        case 230:
                        case 231: value += 5; break;
                        //#endregion
                        //#region left-right 10
                        case 24:
                        case 25:
                        case 28:
                        case 56:
                        case 152:
                        case 29:
                        case 57:
                        case 153:
                        case 60:
                        case 156:
                        case 184:
                        case 61:
                        case 157:
                        case 185:
                        case 188:
                        case 189: value += 10; break;
                        //#endregion
                        //#region left 13
                        case 74:
                        case 75:
                        case 106:
                        case 107:
                        case 78:
                        case 79:
                        case 110:
                        case 111:
                        case 202:
                        case 203:
                        case 206:
                        case 207:
                        case 234:
                        case 235:
                        case 238:
                        case 239: value += 13; break;
                        //#endregion
                        //#region right 7
                        case 82:
                        case 83:
                        case 86:
                        case 87:
                        case 210:
                        case 214:
                        case 211:
                        case 215:
                        case 114:
                        case 115:
                        case 118:
                        case 119:
                        case 242:
                        case 243:
                        case 246:
                        case 247: value += 7; break;
                        //#endregion
                        //#region top 11
                        case 26:
                        case 27:
                        case 30:
                        case 31:
                        case 58:
                        case 59:
                        case 62:
                        case 63:
                        case 154:
                        case 155:
                        case 158:
                        case 159:
                        case 186:
                        case 187:
                        case 190:
                        case 191:
                            value += 11; break;
                        //#endregion
                        //#region bottom 14
                        case 88:
                        case 93:
                        case 101:
                        case 120:
                        case 125:
                        case 216:
                        case 248:
                        case 89:
                        case 121:
                        case 217:
                        case 249:
                        case 92:
                        case 124:
                        case 197:
                        case 220:
                        case 229:
                        case 252:
                        case 253:
                        value += 14; break;
                        //#endregion
                        //#region island 0
                        case 0:
                        case 1:
                        case 4:
                        case 5:
                        case 32:
                        case 33:
                        case 36:
                        case 128:
                        case 132:
                        case 160: break;
                        //#endregion
                        //#region left tail 2
                        case 16:
                        case 20:
                        case 49:
                        case 53:
                        case 144:
                        case 148:
                        case 17:
                        case 21:
                        case 145:
                        case 149:
                        case 48:
                        case 52:
                        case 176:
                        case 177:
                        case 180:
                        case 181: value += 2; break;
                        //#endregion
                        //#region right tail 8
                        case 8:
                        case 9:
                        case 40:
                        case 41:
                        case 12:
                        case 13:
                        case 44:
                        case 45:
                        case 136:
                        case 137:
                        case 140:
                        case 141:
                        case 168:
                        case 169:
                        case 172:
                        case 173: value += 8; break;
                        //#endregion
                        //#region top tail 4
                        case 64:
                        case 69:
                        case 96:
                        case 192:
                        case 224:
                        case 65:
                        case 97:
                        case 193:
                        case 225:
                        case 68:
                        case 100:
                        case 196:
                        case 228: value += 4; break;
                        //#endregion
                        //#region bottom tail 1
                        case 2:
                        case 3:
                        case 6:
                        case 7:
                        case 34:
                        case 35:
                        case 38:
                        case 39:
                        case 130:
                        case 131:
                        case 134:
                        case 135:
                        case 162:
                        case 163:
                        case 166:
                        case 167: value += 1; break;
                        //#endregion
                        //#region top-left 9
                        case 10:
                        case 11:
                        case 14:
                        case 15:
                        case 42:
                        case 43:
                        case 46:
                        case 47:
                        case 138:
                        case 139:
                        case 142:
                        case 143:
                        case 170:
                        case 171:
                        case 174:
                        case 175: value += 9; break;
                        //#endregion
                        //#region top-right 3
                        case 18:
                        case 22:
                        case 19:
                        case 23:
                        case 146:
                        case 150:
                        case 147:
                        case 151:
                        case 50:
                        case 54:
                        case 51:
                        case 55:
                        case 178:
                        case 182:
                        case 179:
                        case 183: value += 3; break;
                        //#endregion
                        //#region bottom-left 12
                        case 72:
                        case 104:
                        case 73:
                        case 105:
                        case 220:
                        case 232:
                        case 221:
                        case 233:
                        case 76:
                        case 108:
                        case 77:
                        case 109:
                        case 200:
                        case 201:
                        case 204:
                        case 205:
                        case 224:
                        case 236:
                        case 225:
                        case 237:
                            value += 12; break;
                        //#endregion
                        //#region bottom-right 6
                        case 80:
                        case 208:
                        case 84:
                        case 212:
                        case 112:
                        case 240:
                        case 116:
                        case 244:
                        case 81:
                        case 209:
                        case 85:
                        case 213:
                        case 113:
                        case 241:
                        case 117:
                        case 245: value += 6; break;
                        //#endregion
                        default: value = 83; miss[code] = 1; break;
                    }
                }
                if (isbug) console.log(value);
                data[ix] = value;
                ix++;
            }
        }
        this.data = data;
        //#endregion
    }
};
MapService.prototype.getSize = function getSize() {
    return [this.width, this.height];
};

MapService.prototype.fetch = function fetch(left, top, width, height) {
    var data = [];
    for (var j=0; j<height; j++) {
        for (var i=0; i<width; i++) {
            var x = (left + i) % this.width;
            var y = (top + j) % this.height;
            var v = this.data[x + y*this.width];
            data.push(v);
        }
    }
    return data;
};