/******************************************************************************
 * Adapter interface prototype
 *  - should be singleton object
 ******************************************************************************/
include('/ge/player/player.js');
(function() {
    var iadapter = function() {

        this.constructor = Player.IAdapter;
    };
    iadapter.prototype.getInfo = function() { throw new Error('Not implemented!'); };
    iadapter.prototype.registerCommands = function(registry) { throw new Error('Not implemented!'); };
    iadapter.prototype.prepareContext = function(data) { throw new Error('Not implemented!'); };
    iadapter.prototype.createTargets = function(targets, data) { throw new Error('Not implemented!'); };
    iadapter.prototype.processCommand = function(target, command, sequence, cursor) { throw new Error('Not implemented!'); };
    iadapter.prototype.updateRefreshRate = function(target, command) { throw new Error('Not implemented!'); };

    // EDITOR
    iadapter.prototype.getCommandSize = function(command, args) { throw new Error('Not implemented!'); };
    iadapter.prototype.makeCommand = function(command, args) { throw new Error('Not implemented!'); };

    // var Player = Player || {};
    Player.IAdapter = iadapter;
})();