include('/lib/service/api.js');
include('./map.js');
(function() {
    function MapApi(definition) {
        MapApi.base.constructor.call(this, definition);
        // ignore instance validation
        this.schema.getInstance = () => true;

        this.map = null;
    }
    extend(ApiServer, MapApi);

const WIDTH = 128;
const HEIGHT = 128;

    MapApi.prototype.initialize = async function initialize() {
        // create map once
        var tileSet = './res/generic-tiles.json';
        this.map = new Map(WIDTH, HEIGHT, tileSet);
    };

    //#region MAP
    MapApi.prototype.read_map = function readMap() {
        var api = this.parent.api;
        var mapType = api.schema.types.get('Map');
        var obj = mapType.createValue(api.map);
        return obj;
    };
    //#endregion

    //#region RANGE
    MapApi.prototype.get_range = function readRange(left, top, width, height) {
        var api = this.parent.api;
        return api.map.readRange(left, top, width, height);
    };
    MapApi.prototype.post_range = function updateRange(left, top, width, height, data) {
        var api = this.parent.api;
    };
    //#endregion

    publish(MapApi, 'MapApi');
})();