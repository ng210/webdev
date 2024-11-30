var Mdl = {
    run: function run() {
        return "Module loaded";
    }
};

typeof self !== 'undefined' ? self.mdlTest = 'loaded' : globalThis.mdlTest = 'loaded';

export { Mdl };