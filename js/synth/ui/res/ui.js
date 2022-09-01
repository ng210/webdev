/* UI subsystem
 *
 *
 * 
 * 
 */
include('/lib/glui/glui-lib.js');
include('/lib/synth/score-control.js');

function Ui() {
    this.mainMenu = null;
    this.main = null;
    this.dialogs = {
        open: null,
        save: null,
        settings: null
    };
    this.panels = [];
}

Ui.prototype.initialize = async function initialize(settings) {
    // create templates
};