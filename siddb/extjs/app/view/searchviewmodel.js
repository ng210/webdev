var _url =window.location.href.indexOf('localhost') != -1 ? 'http://localhost:3000/sids' : 'https://ng210.herokuapp.com/sids';

Ext.define('SidDB.view.searchviewmodel', {
    requires: ['SidDB.model.sid'],
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.searchviewmodel',
    stores: {
        SidStore: {
            model: 'SidDB.model.sid',
            autoLoad: false,
            autoSync: false,
            proxy: {
                type: 'rest',
                reader:{
                    rootProperty: 'data',
                    type: 'json'
                },
                url: _url
                // writer: {
                //     type: 'json',
                //     dateFormat: 'd/m/Y',
                //     writeAllFields: true
                // }
            },
            listeners: {
                load: function(store, records, success, operation) {
                    var reader = store.getProxy().getReader();
                    var response = operation.getResponse();
                    var data = reader.getResponseData(response);
                    if (data) {
                        if (data.error) {
                            alert(data.error);
                        }
                    }
                }
            }

        }
    }
});