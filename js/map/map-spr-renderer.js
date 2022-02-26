include('/lib/webgl/sprite/sprite-manager.js');

(function() {
    function MapSpriteRenderer() {
        this.sprMgr = null;
        this.size = null;
        this.tileSize = null;
        this.offset = new V2();
    }

    MapSpriteRenderer.prototype.initialize = async function initialize(width, height, atlasUrl) {
        this.size = new V2(width, height);
        var count = 2*width*height;
        this.sprMgr = new webGL.SpriteManager();
        await this.sprMgr.initialize(atlasUrl, count);
        this.tileSize = new V2(this.sprMgr.map.frames[0][2], this.sprMgr.map.frames[0][3]);
        this.viewSize = this.tileSize.prod([width, height]);
        // add cells as sprites
        var scale = new V2(gl.canvas.width/this.viewSize.x, gl.canvas.height/this.viewSize.y);
        var unit = this.tileSize.prod(scale);
        var pos = new V2(0.5, height-0.5).mul(unit);
        for (var j=0; j<height; j++) {
            var x = pos.x;
            for (var i=0; i<width; i++) {
                for (var k=0; k<2; k++) {
                    var spr = this.sprMgr.addSprite();
                    spr.row = j; spr.col = i; spr.lay = k;
                    spr.setFrame(0);
                    spr.setPosition(pos);
                    spr.setScale(scale.prodC(1.0));
                    spr.setRotationZ(0);
                    spr.setColor([1, 1, 1, k]);
                }
                pos.x += unit.x;
            }
            pos.x = x;
            pos.y -= unit.y;
        }
        //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    };

    MapSpriteRenderer.prototype.setData = function setData(data) {
        // update sprite colors
        var ix = 0;
        for (var j=0; j<this.size[1]; j++) {
            for (var i=0; i<this.size[0]; i++) {
                var f = data[ix];
                this.sprMgr.sprites[ix++].setFrame(f);
                f = data[ix];
                this.sprMgr.sprites[ix++].setFrame(f);
                //this.sprMgr.sprites[ix].setColor(col, col, col, 1.0);
            }
        }
    };

    MapSpriteRenderer.prototype.update = function update() {
        this.sprMgr.update();
    };

    MapSpriteRenderer.prototype.render = function render() {
        this.sprMgr.render();
    };

    publish(MapSpriteRenderer, 'MapSpriteRenderer');
})();