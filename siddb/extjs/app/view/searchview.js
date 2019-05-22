Ext.define('SidDB.view.searchview', {
    requires: ['SidDB.view.searchviewmodel', 'SidDB.view.searchcontroller'],
    extend: 'Ext.container.Viewport',
    xtype: 'searchview',
    //title: 'Sid search',

    controller: 'search',
    viewModel: 'searchviewmodel',
    selType: 'rowmodel',
    selModel: {
        mode: 'SINGLE'
    },
    viewConfig: {
        stripeRows: true
    },
    // listeners: {
    //     selectionchange: 'onSelectionChange'
    // },
    layout: {
        type: 'hbox',
        align: 'center',
        pack: 'center'
    },
    items: [
        {
            xtype: 'panel',
            cls: 'main-panel',
            width:'90%',
            height:'86%',
            layout: {
                type: 'vbox',
                align: 'center'
            },
            items: [
                {   xtype: 'label', baseCls: 'main-header', text: 'HVSC search' },
                {   xtype: 'label', baseCls: 'main-header-sub', text: 'High Voltage Sid Collection'},
                {   xtype: 'displayfield', fieldCls: 'description_', baseBodyCls: 'description',
                    width: '80%',
                    value: 'The database contains information about n SID files. You can search on <i>title</i>, <i>author</i>, <i>copyright</i> and <i>year</i>. It is possible to search for a particular attribute, for example to search for a title add <i>title:&lt;searched value&gt;</i>.'
                },
                {   xtype: 'panel',
                    width:'80%',
                    layout: {
                        type: 'hbox'                
                    },
                    items: [
                        {   xtype: 'textfield', itemId: 'query',
                            flex: 8,
                            emptyText: '<search expression>',
                            listeners: {
                                specialKey: 'onSearchSpecialKey'
                            }
                        },
                        {   xtype: 'button', text: 'Search',
                            flex: 2,
                            listeners: {
                                click: 'onSearchClick'
                            }
                        }
                    ]
                },
                {   xtype: 'grid',
                    width:'80%',
                    height: 480,
                    bind: {
                        store: '{SidStore}'
                    },
                    emptyText: 'There are no records to display.',
                    columns: [
                        {
                            text: "Title",
                            dataIndex: 'title',
                            flex: 0.4
                        },
                        {
                            text: "Author",
                            dataIndex: 'author',
                            flex: 0.4
                        },
                        {
                            text: "Copyright",
                            dataIndex: 'copyright',
                            flex: 0.2
                        },
                        {
                            text: "Year",
                            dataIndex: 'year',
                        }
                    ]
                }
            ]
        }
    ]
});