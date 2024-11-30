include('/lib/type/schema.js');

// include('/lib/service/api.js');
// const LOCAL_STORAGE_KEY = 'synth-app';
// const STORE_API_URL = '/synth/store-api.json';

(function() {
    function Data() {
        this.schema = null;
        this.settings = null;
    }
    Data.prototype.loadSchema = async function loadSchema(url) {
        this.schema = await Schema.load(url);
        this.schema.id = 'synth-app';
    };
    Data.prototype.loadSettings = async function loadSettings(url) {
        var settings = await Data.loadResource(url);
        var results = this.schema.validate(settings, 'settings');
        if (results.length > 0) throw new Error(results);
        this.settings = settings;
    };

    //#region static methods
    Data.initialize = async function initialize(app) {
        app.data = new Data();
        await app.data.loadSchema('./data/schema.json'),
        await app.data.loadSettings('./data/settings.json')
        console.log('Data initialized');
    };
    Data.loadResource = async function loadResource(url) {
        var res = await load(url);
        if (res.error) throw res.error;
        return res.data;
    };

    Data.downloadResource = async function downloadResource(res) {
        ;
    };
    //#endregion

    publish(Data, 'Data', SynthApp);
})();

// SynthApp.prototype.loadSong = async function loadSong(url) {
//     var errors = [];
//     await this.play.load(url, errors);

//     if (errors.length > 0) {
//         this.printMessages(errors);
//         // display error dialog
//     } else {
//         // create synth panels
//         this.ui.removeSynthPanels();
//         var synthAdapter = this.play.player.adapters.find(a => a.adapter.getInfo().id == psynth.SynthAdapter.info.id).adapter;
//         var synths = synthAdapter.devices;
//         for (var i=0; i<synths.length; i++) {
//             await this.ui.addSynthPanel(synths[i]);
//         }

//         // update sequences info
//         this.ui.sequences.max = this.play.getSequences().length - 1;
//         this.ui.sequences.setValue(0);

//         this.ui.resize();
//     }
// };