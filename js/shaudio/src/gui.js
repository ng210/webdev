include('/lib/glui/glui-lib.js');

(function() {
    function Gui(app) {
        this.app = app;
    }

    Gui.create = async function gui_create(app) {
        return new Gui(app);
    };

    publish(Gui, 'Gui');
})();