var _url =window.location.href.indexOf('localhost') != -1 ? 'http://localhost:3000/sids' : 'https://ng210.herokuapp.com/sids';

Ext.define('SidDB.view.searchviewmodel', {
    requires: ['SidDB.model.sid'],
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.searchviewmodel',
    stores: {
        SidStore: {
            model: 'SidDB.model.sid',
            autoLoad: true,
            autoSync: false,
            proxy: {
                type: 'rest',
                reader:{
                    rootProperty: 'data',
                    type: 'json'
                },
                url: _url,
                // writer: {
                //     type: 'json',
                //     dateFormat: 'd/m/Y',
                //     writeAllFields: true
                // }
            }
        }
    }
});