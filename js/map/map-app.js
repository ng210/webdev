include('/lib/math/v2.js');
include('/lib/service/api.js');
include('./api/map.js');
include('./map-spr-renderer.js');

(function() {
    function MapApp() {
        this.mapApi = null;
        this.viewSize = new V2();
        this.mapSize = new V2();
        this.tileSize = new V2();
        this.renderer = new MapSpriteRenderer();
        this.data = null;
    }

    MapApp.prototype.processResponse = function processResponse(resp) {
        if (resp.statusCode != 200) throw new Error(`Communication error (${resp.statusCode})`);
        if (resp.error) throw resp.error;
        return resp.data;
    }

    MapApp.prototype.initialize = async function initialize(settings) {
    // settings:
    // - size: [width, height] of visible area
    // - service: url of map-service
        if (!Array.isArray(settings.size) || !settings.service) throw new Error('Could not initialize, mandatory settings missing!')
        this.viewSize.set(settings.size);
        this.data = new Array(2 * this.viewSize.x * this.viewSize.y);
var tileSetUrl = './res/generic-tiles.json';
this.createTestData(tileSetUrl);
        // // create api client and fetch map info
        // this.mapApi = await Api.Client(settings.service);
        // var resp = await this.mapApi.rest.map.read();
        // var mapInfo = this.processResponse(resp);
        // var tileSetUrl = mapInfo['tiles-url'];
        // this.mapSize.set(mapInfo.width, mapInfo.height);
        await this.renderer.initialize(this.viewSize.x, this.viewSize.y, tileSetUrl);
        //await this.readRange();
        this.renderer.setData(this.data);
    };

    MapApp.prototype.readRange = async function readRange(left, top, width, height) {
        left = left || 0;
        top = top || 0;
        width = width || this.viewSize.x;
        height = height || this.viewSize.y;
        var resp = await this.mapApi.endpoints.range.get.do(left, top, width, height);
        this.data = this.processResponse(resp);
    };

    MapApp.prototype.update = function update(dt, frame) {
        // var x = 0;
        // for (var i=0; i<this.sprMgr.count; i++) {
        //     var spr = this.sprMgr.sprites[i];
        //     spr.position.x = spr.width*(spr.tile[0] + (frame%100 - 50)/100);
        //     this.sprMgr.updateSpritePosition(spr);
        // }
        // this.sprMgr.updateBuffer();
        this.renderer.update(dt, frame);
    };

    MapApp.prototype.render = function render(dt, frame) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        this.renderer.render();

    };

    var _ts = 0;
    var _frame = 0;
    MapApp.prototype.run = function run(ts) {
        // process inputs
        var dt = ts - _ts;
        this.update(dt, _frame);
        this.render(dt, _frame);
        var app = this;
        requestAnimationFrame( (ts) => app.run(ts) );
        _ts = ts;
        _frame++;
    };


    MapApp.prototype.createTestData = function createTestData(tileSetUrl) {
        const WIDTH = 128;
        const HEIGHT = 128;
        this.map = new Map(WIDTH, HEIGHT, tileSetUrl);
        this.data = this.map.readRange(0, 0, this.viewSize.x, this.viewSize.y);
    }

    publish(MapApp, 'MapApp');
})();