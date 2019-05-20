Ext.define('SidDB.view.SearchController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.search',

    onSearchClicked: function (sender, record) {
        var query = sender.previousNode('textfield');
        var store = this.getViewModel().getStore('SidStore');
        var filter = query.getValue();
        if (filter) {
            store.getProxy().setExtraParam('text', query.getValue());
        }
        store.read();
    }
});