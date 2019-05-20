Ext.define('SidDB.model.sid', {
    extend: 'Ext.data.Model',
    //idProperty:'Id',
    schema: {
        namespace: 'SidDB.model'
    },
    fields: [
        // { name: 'Id', type: 'int', defaultValue: 0},
        { name: 'title', type: 'string' },
        { name: 'author', type: 'string' },
        { name: 'copyright', type: 'string' },
        { name: 'year', type: 'int' }
    ],
    
    // validations: [{
    //     type: 'presence',
    //     field: 'firstName'
    // }]

});