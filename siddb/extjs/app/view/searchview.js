Ext.define('SidDB.view.searchview', {
    requires: ['SidDB.view.searchviewmodel', 'SidDB.view.searchcontroller'],
    extend: 'Ext.container.Viewport',
    xtype: 'searchview',
    title: 'Sid search',

    controller: 'search',
    viewModel: 'searchviewmodel',
    //reference:'studentlistgrid',
    // selType: 'rowmodel',
    // selModel:
    // {
    //     mode: 'SINGLE'
    // },
    // viewConfig:
    // {
    //     stripeRows: true
    // },
    // listeners: {
    //     selectionchange: 'onSelectionChange'
    // },
    layout: {
        type: 'vbox',
        align: 'center',
        pack: 'center'
    },
    items: [
        {
            xtype: 'panel',
            width: 640,
            layout: {
                type: 'hbox'
            },
            items: [
                {
                    xtype: 'textfield',
                    itemId: 'query',
                    flex: 3
                },
                {
                    xtype: 'button',
                    text: 'Search',
                    flex: 1,
                    listeners: {
                        click: 'onSearchClicked'
                    }
                }
            ]
        },
        {
            xtype: 'grid',
            width: 640,
            height: 480,
            bind: {
                store: '{SidStore}'
            },

            columns: [
                {
                    text: "Titel",
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
});