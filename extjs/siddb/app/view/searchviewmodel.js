Ext.define('SidDB.view.SearchViewModel', {
    requires: ['SidDB.model.Sid'],
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.searchviewmodel',
    stores: {
        SidStore: {
            model: 'SidDB.model.Sid',
            autoLoad: true,
            autoSync: false,
            proxy: {
                type: 'rest',
                reader:{
                    rootProperty: 'data',
                    type: 'json'
                },
                url: 'data/test-data.json',
                // writer: {
                //     type: 'json',
                //     dateFormat: 'd/m/Y',
                //     writeAllFields: true
                // }
            }
        }
    }
});