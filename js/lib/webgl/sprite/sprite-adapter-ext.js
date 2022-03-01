include('/lib/player/player-lib.js');
include('/lib/player/iadapter-ext.js');
include('/lib/webgl/sprite/sprite-manager.js');

(function() {
    implements(webGL.SpriteManager, Ps.IAdapterExt);

// IAdapterExt implementation
    webGL.SpriteManager.prototype.makeCommand = function(command)  {
        var stream = new Stream(128);
        stream.writeUint8(command);
        switch (command) {
            case webGL.SpriteManager.Commands.SetFrame:
                var frame = this.getUint8Argument(arguments, 0);
                stream.writeUint8(frame);
                break;
            case webGL.SpriteManager.Commands.SetPosition:
                var tx = this.getFloat32Argument(arguments, 0);
                var ty = this.getFloat32Argument(arguments, 1);
                var tz = this.getFloat32Argument(arguments, 2);
                stream.writeFloat32(tx);
                stream.writeFloat32(ty);
                stream.writeFloat32(tz);
                break;
            case webGL.SpriteManager.Commands.SetScale:
                var sx = this.getFloat32Argument(arguments, 0);
                var sy = this.getFloat32Argument(arguments, 1);
                stream.writeFloat32(sx);
                stream.writeFloat32(sy);
                break;
            case webGL.SpriteManager.Commands.SetRotation:
                var r = this.getFloat32Argument(arguments, 0);
                stream.writeFloat32(r);
                break;
            case webGL.SpriteManager.Commands.SetColor:
                var color = this.getUint32Argument(arguments, 0);
                stream.writeUint32(color);
                break;
            case webGL.SpriteManager.Commands.SetAlpha:
                var alpha = this.getUint8Argument(arguments, 0);
                stream.writeUint8(alpha);
                break;
            case webGL.SpriteManager.Commands.SetSprite:
                var fr = this.getUint8Argument(arguments, 0);
                var tx = this.getFloat32Argument(arguments, 1);
                var ty = this.getFloat32Argument(arguments, 2);
                var tz = this.getFloat32Argument(arguments, 3);
                var sx = this.getFloat32Argument(arguments, 4);
                var sy = this.getFloat32Argument(arguments, 5);
                var rz = this.getFloat32Argument(arguments, 6);
                var col = [
                    this.getUint8Argument(arguments, 7),
                    this.getUint8Argument(arguments, 8),
                    this.getUint8Argument(arguments, 9),
                    this.getUint8Argument(arguments, 10)
                ];
                stream.writeUint8(fr);
                stream.writeFloat32(tx);
                stream.writeFloat32(ty);
                stream.writeFloat32(tz);
                stream.writeFloat32(sx);
                stream.writeFloat32(sy);
                stream.writeFloat32(rz);
                stream.writeArray(col);
                break;
            case webGL.SpriteManager.Commands.Show:
            case webGL.SpriteManager.Commands.Hide:
                break;
            case webGL.SpriteManager.Commands.Delta:
                var ci = this.getUint8Argument(arguments, 0);
                var df = this.getUint16Argument(arguments, 1);
                var dv = this.getFloat32Argument(arguments, 2);
                stream.writeUint8(ci);
                stream.writeUint16(df);
                stream.writeFloat32(dv);
                break;
        }

        stream.buffer = stream.buffer.slice(0, stream.length);
        return stream;
    };

    webGL.SpriteManager.prototype.getSymbols = () => webGL.SpriteManager.symbols;
    var uint8 = Ps.Player.schema.types.get('uint8');
    webGL.SpriteManager.symbols = {
        'Spr.SetFrame':       { 'type':uint8, 'value': webGL.SpriteManager.Commands.SetFrame },
        'Spr.SetPosition':    { 'type':uint8, 'value': webGL.SpriteManager.Commands.SetPosition },
        'Spr.SetScale':       { 'type':uint8, 'value': webGL.SpriteManager.Commands.SetScale },
        'Spr.SetRotation':    { 'type':uint8, 'value': webGL.SpriteManager.Commands.SetRotation },
        'Spr.SetColor':       { 'type':uint8, 'value': webGL.SpriteManager.Commands.SetColor },
        'Spr.SetAlpha':       { 'type':uint8, 'value': webGL.SpriteManager.Commands.SetAlpha },
        'Spr.SetSprite':      { 'type':uint8, 'value': webGL.SpriteManager.Commands.SetSprite },
        'Spr.Show':           { 'type':uint8, 'value': webGL.SpriteManager.Commands.Show },
        'Spr.Hide':           { 'type':uint8, 'value': webGL.SpriteManager.Commands.Hide },
        'Spr.Delta':          { 'type':uint8, 'value': webGL.SpriteManager.Commands.Delta },

        'Spr.Sprite':         { 'type':uint8, 'value': webGL.SpriteManager.Device.Sprite },
        'Spr.Batch':          { 'type':uint8, 'value': webGL.SpriteManager.Device.Batch },

        'Spr.tx':             { 'type':uint8, 'value': webGL.Sprite.Fields.tx },
        'Spr.ty':             { 'type':uint8, 'value': webGL.Sprite.Fields.ty },
        'Spr.tz':             { 'type':uint8, 'value': webGL.Sprite.Fields.tz },
        'Spr.sx':             { 'type':uint8, 'value': webGL.Sprite.Fields.sx },
        'Spr.sy':             { 'type':uint8, 'value': webGL.Sprite.Fields.sy },
        'Spr.rz':             { 'type':uint8, 'value': webGL.Sprite.Fields.rz },
        'Spr.cr':             { 'type':uint8, 'value': webGL.Sprite.Fields.cr },
        'Spr.cg':             { 'type':uint8, 'value': webGL.Sprite.Fields.cg },
        'Spr.cb':             { 'type':uint8, 'value': webGL.Sprite.Fields.cb },
        'Spr.ca':             { 'type':uint8, 'value': webGL.Sprite.Fields.ca }
    };
})();