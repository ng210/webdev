Ext.define('SidDB.view.searchcontroller', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.search',

    search: function(filter) {
        if (filter) {
            var filters = {};
            var tokens = filter.split(' ');
            if (Array.isArray(tokens)) {
                tokens.forEach(t => {
                    var f = t.split(':');
                    if (f.length > 0) {
                        if (f.length == 1) {
                            filters.text = f;
                        } else {
                            filters[f[0]] = f[1];
                        }
                    }
                });
            } else {
                filters.text = filter;
            }
            var store = this.getViewModel().getStore('SidStore');
            store.getProxy().setExtraParams(filters);
            store.read();
        }
    },

    onSearchClick: function (sender, record) {
        var query = sender.previousNode('textfield');
        this.search(query.getValue());
    },
    onSearchSpecialKey: function (field, e) {
        if (e.getKey() == e.ENTER) {
            this.search(field.getValue());
        }
    }
});