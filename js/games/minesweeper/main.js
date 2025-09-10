import { Minesweeper } from './minesweeper.js';

var _game = null;

window.onload =
    async function onload() {
        _game = new Minesweeper(document.getElementsByClassName('board')[0], 20, 16);
        await _game.loadAssets();
        _game.mainLoop();
    };

window.onresize = function onresize(e) {
    _game.resize();
}
