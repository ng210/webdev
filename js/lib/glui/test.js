include('glui-lib.js');
include('/lib/data/dataseries.js');
include('/lib/data/graph.js');

(function() {

    var style = {
        'font': 'Arial 10',
        'width':'10em', 'height':'1.5em',
        'align':'right middle',
        'border':'#406080 1px inset',
        'background-color': '#c0e0ff',
        'background-image': 'none'
    };
    var buttonStyle = {
        'font': 'Arial 12',
        'width':'14em', 'height':'2em',
        'align':'center middle',
        'border':'#808090 2px',
        'background-color': '#a0a0b0'
    };
    var tableStyles = {
        'table': {
            'font': 'Arial 12',
            'width':'24em',
            'align':'center middle',
            'border':'#308060 3px outset',
            'color': '#184030',
            'background-color': '#308060'
        },
        'cell': {
            'font': 'Arial 14',
            'align':'center middle',
            'border':'#80b0c0 1px inset',
            'color': '#102040',
            'background-color': '#80f0c0',
            'width': '4em'
        },
        'title': {
            'font': 'Arial 16',
            'border':'#a0ffc0 2px outset',
            'color': '#204060',
            'background-color': '#a0ffc0',
            'height': '1.5em'
        },
        'header': {
            'font': 'Arial 14',
            'height':'2.0em',
            'align':'center middle',
            'border':'#60a080 2px outset',
            'color': '#000000',
            'background-color': '#60a080'
        }
    };
    var comboboxStyle = {
        'font': 'Arial 15',
        'align':'center middle',
        'border':'#7090c0 2px solid',
        'color': '#102040',
        'background-color': '#90b0c0',
        'width': '10em'
    };
    var menuStyle = {
        'font': 'Arial 14px normal',
        'align':'center middle',
        'border':'#607080 1px outset',
        'color': '#001010',
        'background-color': '#607080',
        'spacing': '2px 1px',
        'padding': '2px 2px'
    };
    var menuItemTemplate = {
        'type': 'Label',
        'layout': 'vertical',
        'style': {
            'border':'#607080 1px outset',
            'align': 'left middle',
            'width': '10em',
            'padding': '3px 2px'
            // 'height': '1.2em',
        }
    };

    var controls = [
        {   'type': 'Label',
            'style': {
                'font': 'Arial 14',
                'width':'auto', 'height':'2.1em',
                'align':'center middle',
                'border':'#406080 1px inset',
                'background-color': '#c0e0ff',
                'background-image': 'none'
            },
            'value': 'label'
        },
        {   'type': 'Label',
            'style': {
                'font': 'Arial 14',
                'width':'auto', 'height':'2.1em',
                'align':'center middle',
                'border':'#406080 1px inset',
                'background-color': '#c0ffe0',
                'background-image': 'none'
            },
            'data-source': 'data',
            'data-field': 'label1'
        },
        {   'type': 'Label',
            'style': style,
            'data-type': 'int',
            'decimal-digits': 2,
            'data-source': 'data',
            'data-field': 'label2'
        },

        {   'type': 'Textbox',
            'style': style,
            'look': 'textbox',
            'decimal-digits': 3,
            'value': 'textbox'
        },
        {   'type': 'Textbox',
            'style': style,
            'look': 'textbox',
            'decimal-digits': 3,
            'data-source': 'data',
            'data-field': 'textbox1'
        },
        {   'type': 'Textbox',
            'style': style,
            'look': 'potmeter',
            'data-type': 'int',
            'decimal-digits': 1,
            'data-source': 'data',
            'data-field': 'textbox2'
        },

        {   'type': 'Button',
            'style': buttonStyle,
            'data-source': 'data',
            'data-field': 'button',
            'command':'Button clicked'
        },

        {   'type': 'Image',
            'style': {
                'width':'128px', 'height':'96px',
                'border':'#805020 2px inset',
                'background-color': '#102040'
            },
            'source': '/lib/glui/res/test.png'
        },

        {   'type': 'Grid',
            'style': {
                'color': '#ffd080',
                'background-color': '#104080',
                'width': '640px', 'height': '400px',
                'border': '#102040 2px inset'
            },
            'unit-x': 10,
            'unit-y': 8,
            'scroll-x-min': 20,
            'scroll-x-max': 40,
            'scroll-y-min': 32,
            'scroll-y-max': 32,
            'data-source': 'data',
            'data-field': 'grid',
            'insert-mode': 'x-bound',
            'drag-mode': 'free',
            'curve-mode': 'line',
            'scale-x': 2.0,
            'scale-y': 2.0
        },

        {   'type': 'Textbox',
            'style': {
                'font': 'Arial 10',
                'align':'center middle',
                'width': '24px',
                'border':'#204080 1px outset',
                'background-color': '#204080',
                'color': '#80a0f0'
            },
            //'image': 'glui/res/knob.png',
            //'data-type': 'int',
            //'decimal-digits': 1,
            'look': 'knob',
            'min': 0, 'max': 255, 'value': 10
        },
        {   'type': 'Textbox',
            'style': {
                'font': 'Arial 10',
                'align':'center middle',
                'width': '40px',
                'border':'#204080 1px outset',
                'background-color': '#204080',
                'color': '#80a0f0'
            },
            //'image': 'glui/res/knob.png',
            //'data-type': 'int',
            //'decimal-digits': 1,
            'look': 'knob',
            'min': 0, 'max': 255, 'value': 200
        },

        // {   'type': 'GraphView',
        //     'style': {
        //         'color': '#ffd080',
        //         'background-color': '#102040',
        //         'width': '640px', 'height': '400px',
        //         'border': '#102040 2px inset',
        //         'line': '#102040 2px normal'
        //     },
        //     'data-source': 'data',
        //     'data-field': 'tree',
        //     'node-template': {
        //         'type': 'Label',
        //         'data-type': 'string',
        //         'style': {
        //             'font': 'Arial 10',
        //             'width':'auto', 'height':'2.2em',
        //             'align':'left middle',
        //             'border':'#406080 1px inset',
        //             'background-color': '#f0f0cf',
        //             'background-image': 'none'
        //         },
        //         'data-source':'',
        //         'data-field':''
        //     },
        //     'look': {
        //         'type': 'arc',
        //         'arc-max': '180'
        //     }
        // },
        // {
        //     'type': 'Combobox',
        //     'style': comboboxStyle,
        //     'readonly': true,
        //     'rows': 4,
        //     'data-source': 'data',
        //     'data-field': 'combobox',
        //     'key-field': 'name',
        //     'values': 'data.table',
        //     'row-template': {
        //         'name': { 'type': 'Label', 'style': { 'width':'65%', 'background-color': '#60c0a0', 'border':'#60c0a0 2px inset' } },
        //         'age': { 'type': 'Textbox', 'data-type': 'int', 'style': { 'width':'35%', 'background-color': '#d0fff0', 'border':'#608078 1px inset' } }
        //     }
        // }
    ];

    window.data = {
        'label1': 'Label Text',
        'label2': 10,
        'textbox1': 'Textbox 1',
        'textbox2': 20,
        'button': 'Button',
        'table': [
            { 'name': 'James', 'age': 38, 'rank': 8 },
            { 'name': 'Ivy', 'age': 32, 'rank': 9 },
            { 'name': 'Alfred', 'age': 61, 'rank': 6 },
            { 'name': 'Henry', 'age': 17, 'rank': 10 },
            { 'name': 'Blange', 'age': 60, 'rank': 7 },
            { 'name': 'Wilson', 'age': 62, 'rank': 5 },
            { 'name': 'George', 'age': 67, 'rank': 1 },
            { 'name': 'Teddy', 'age': 52, 'rank': 2 },
            { 'name': 'Sissy', 'age': 29, 'rank': 3 },
            { 'name': 'Poppy', 'age': 27, 'rank': 4 }
        ],
        'list': [ 'James', 'Ivy',  'Alfred', 'Henry', 'Blange', 'Wilson', 'George', 'Teddy', 'Sissy', 'Poppy', 'Mable', 'Jerry' ],
        'grid': [
            { 'x': 5, 'y': 5, 'value': 0.1},
            { 'x':15, 'y':11, 'value': 0.3},
            { 'x':25, 'y': 6, 'value': 0.4},
            { 'x':35, 'y':12, 'value': 0.2},
            { 'x':45, 'y': 7, 'value': 0.4},
            { 'x':55, 'y':13, 'value': 0.2}
        ],
        'main-menu': {
            "items": [
                {
                    'label': 'File',
                    'key': 'ALT F',
                    'items': [
                        {
                            'label': 'Open', 'command': 'OPEN', 'key': 'CTRL O',
                            'items': [
                                { 'label': 'Resource1', 'command': 'RES1' },
                                { 'label': 'Resource2', 'command': 'RES2' }
                            ]
                        },
                        { 'label': 'Save', 'command': 'SAVE', 'key': 'CTRL S' }
                    ]
                },
                {
                    'label': 'Edit',
                    'key': 'ALT E',
                    'items': [
                        { 'label': 'Cut',   'command': 'CUT',   'key': 'CTRL X' },
                        { 'label': 'Copy',  'command': 'COPY',  'key': 'CTRL C' },
                        { 'label': 'Paste', 'command': 'PASTE', 'key': 'CTRL V' }
                    ]
                },
                { 'label': 'Help', 'command': 'HELP', 'key': 'F1' }
            ]
        },
        'res-list': [
            { 'name': 'image1.png', 'size': 12567 },
            { 'name': 'image2.png', 'size': 34768 },
            { 'name': 'image3.png', 'size': 23975 },
            { 'name': 'image4.png', 'size': 132569 }
        ],

        'combobox': 'James',

        'tree': (function() {
            var g = new Graph();
            var v0 = g.addVertex(null, 'Sandor', null);
            var v1 = g.addVertex(v0, 'Adri', '1977-01-20');
            // g.addVertex(v1, 'Klari', '2015-12-08');
            // g.addVertex(v1, 'Jancsi', '2017-08-18');
            // v1 = g.addVertex(v0, 'Gabor', '1979-04-20');
            // g.addVertex(v1, 'Gergely', '2008-10-28');
            return g;
        })()
    };

    var App = {
        dlg: null,
        selection: null,

        onclick: function onclick(e, ctrl) {
            if (ctrl instanceof glui.Button) {
                switch (ctrl.id) {
                    default:
                        Dbg.prln('Click ' + ctrl.id);
                        break;
                }
            }
        },
        onchange: function onchange(e, ctrl) {
            Dbg.prln(`Changed ${ctrl.id}.value: ${e.oldValue} => ${e.value}`);
        },
        oncommand: function oncommand(e, ctrl) {
            Dbg.prln('App.oncommand: ' + e.command);
        },
        isInitialized: false
    };

    async function setup() {
        if (!App.isInitialized) {
            glui.scale.x = 1.0;
            glui.scale.y = 1.0;
            await glui.initialize(App, true);
            App.isInitialized = true;
            Dbg.prln(`Screen size is ${glui.width}x${glui.height}`);
        } else {
            glui.setRenderingMode(glui.Render2d);
            //glui.repaint();
        }
    }

    function teardown() {
        glui.reset();
    }

    function createControls() {
        var top = glui.screen.renderer.convertToPixel('3em', true), left = 10;
        var width = 0;
        for (var i=0; i<controls.length; i++) {
            message(controls[i].type);
            var ctrl = glui.create(`${controls[i].type}${i}`, controls[i], null, App);
            if (ctrl instanceof glui.Table) {
                ctrl.build();
            }
            ctrl.getBoundingBox();
            var top_= top + 8 + parseFloat(ctrl.height);
            if (top_> glui.screen.height/2) {
                top = 10;
                top_ = 18 + parseFloat(ctrl.height);
                left += width + 10;
                width = 0;
            }
            ctrl.move(left, top);
            width = Math.max(width, parseFloat(ctrl.width));
            top = top_;
        }
        // var ctrl = glui.getControlById('Label1');
        // ctrl.style['background-image'] = 'glui/background.png';
    }

    async function renderUI() {
        // await glui.setRenderingMode(glui.Render2d);
        // renderer = new glui.Renderer2d();
        // renderer.setFont('Arial 12 normal');
        //glui.screen.renderer.setFont('Arial 12 normal');
        // var top = glui.screen.renderer.convertToPixel('5em', true), left = 10;
        // var width = 0;
        // for (var i=0; i<glui.screen.items.length; i++) {
        //     var ctrl = glui.screen.items[i];
        //     // if (ctrl.parent == null) {
        //     //     //ctrl.move(left, top);
        //     //     width = Math.max(width, parseFloat(ctrl.width));
        //     //     ctrl.getBoundingBox();
        //     //     top += 8 + parseFloat(ctrl.height);
        //     //     if (top > screen.height/4) {
        //     //         top = 10;
        //     //         left += width + 10;
        //     //         width = 0;
        //     //     }
        //     // }
        // }
        glui.resize();
        //glui.render();
    }

    async function test_clipping() {
        header('Test clipping');
        await setup();
        var tmpl1 = {
            'type': 'Table',
            'style': {
                'font': 'Arial 24',
                'width':'20em', 'height':'auto',
                'align':'center middle',
                'border':'#808080 4px outset',
                'color': '#000000',
                'background-color': '#e0e0e0'
            },
            'cell-template': {
                'type':'Label',
                'style': {
                    'font': 'Arial 14',
                    'width':'100%', 'height':'1.5em',
                    'align':'center middle',
                    'border':'#e0e0e0 2px outset',
                    'color': '#808080',
                    'spacing': '4px'
                }
            },
            'cols': 2, 'rows': 3,
            'mode': glui.Table.modes.BOARD,
            'data-source': 'data',
            'data-field': 'list'
        };

        var cnt = await glui.create('cnt1', tmpl1, null, App); await cnt.build();
        cnt.render();
        glui.animate();
        await button('Next');
        teardown();
        //glui.screen.remove(cnt);
    }

    async function test_construct() {
        header('Test construct');
        await setup();
        await createControls();
        for (var i=0; i<glui.screen.items.length; i++) {
            var control = glui.screen.items[i];
            test(`Should create ${control.type} from template`, ctx => {                
                ctx.assert(control, '!=', null);
                if (control instanceof glui.ValueControl) {
                    ctx.assert(control.id, '=', `${control.constructor.name}${i}`);
                    ctx.assert(control instanceof glui[controls[i].type], '=', true);
                    if (control.dataSource) {
                        ctx.assert(control.value, '=', data[controls[i]['data-field']]);
                    } else {
                        ctx.assert(control.value, '=', controls[i].value);
                    }
                }
            });
            test(`Should validate ${control.type} successfully`, ctx => {
                var res = glui.schema.validate(control, glui.schema.types.get(control.constructor.name));
                for (var i=0; i<res.length; i++) {
                    message(`${res[i].field}: ${res[i].messages}`);
                }
                ctx.assert(res, 'empty');
            });
        }
        glui.animate();
        await button('Next');
        teardown();
    }

    async function test_render() {
        header('Test rendering');
        await setup();
        createControls();
        await glui.repaint();
        glui.animate();
        await button('Next');

        var ctrl1 = glui.getControlById('Label0');
        var ctrl2 = glui.getControlById('Label1');
        ctrl1.dataBind(window.data, 'label1');
        ctrl2.setValue('Hello world!');
        // repaint due to possible control resize
        await glui.repaint();
        await button('Next');

        // var select = await glui.OpenSaveDialog({'title': 'Open image...', 'filters': ['*.png', '*.jpg'], 'init': function() { this.move(100, 100);} }, App);
        // Dbg.prln('Selected image: ' + select);

        teardown();
    }

    async function test_align() {
        header('Test align');
        await setup();
        var hAlign = ['left', 'center', 'right'];
        var vAlign = ['top', 'middle', 'bottom'];
        var x = 10, y = 10;
        for (var j=0; j<vAlign.length; j++) {
            x = 10;
            for (var i=0; i<hAlign.length; i++) {
                var a = hAlign[i] + ' ' + vAlign[j];
                var ctrl = await glui.create('ctrl'+i+j, {
                    'type': 'Label',
                    'style': {
                        'align': a,
                        'font': 'Arial 10',
                        'border': '#6080e0 2px outset',
                        'background-color': '#6890f0',
                        'color': '#202638',
                        'padding': '0.1em 0.1em',
                        'width': '12em', 'height': '3em',
                    },
                    'value': a
                }, null, App);
                ctrl.setValue(a);
                ctrl.move(x, y);
                x += ctrl.width + 10;
                ctrl.render();
            }
            y += ctrl.height + 10;
        }

        glui.render();
        await button('Next');
        teardown();
    }

    async function test_container() {
        header('Test container');
        await setup();    
        var containerTemplate = {
            'type': 'Container',
            'style': {
                'left': '10px', 'top': '4em',
                'width': '40em', 'height': '16em',
                'background-color': '#8080f0',
                'border':'#404080 2px outset',
                'z-index': 0
            },
            'title': 'Default',
            'items': [
                {
                    'type': 'Textbox',
                    'style': {
                        'left': '1em', 'top': '1em',
                        'width':'10em', 'height':'2em',
                        'border':'#c0c0e0 1px inset',
                        'color': '#e0e0f0',
                        'background-color': '#102080'
                    },
                    'look': 'textbox',
                    'decimal-digits': 3,
                    'data-source': 'data',
                    'data-field': 'textbox1'
                },
                {
                    'type': 'Textbox',
                    'style': {
                        'left': '1em', 'top': '3.5em',
                        'width':'10em', 'height':'2em',
                        'border':'#c0c0e0 1px inset',
                        'color': '#e0e0f0'
                    },
                    'look': 'textbox',
                    'decimal-digits': 3,
                    'data-source': 'data',
                    'data-field': 'textbox2'
                },
                {
                    'type': 'Image',
                    'style': {
                        'left': '1em', 'top': '6em',
                        'width':'96px', 'height':'96px',
                        'border':'#c0c0f0 2px solid'
                    },
                    'source': '/lib/glui/res/test.png'
                }
            ]
        };

        var container = glui.create('container1', containerTemplate, null, App);
        test('Container has 2 Textbox and an Image items', ctx => {
            ctx.assert(container.items.length, '=', 3);
            ctx.assert(container.items[0].constructor, '=', glui.Textbox);
            ctx.assert(container.items[1].constructor, '=', glui.Textbox);
            ctx.assert(container.items[2].constructor, '=', glui.Image);
        });

        test('Container items should keep or take over parent\'s style settings', ctx => {
            ctx.assert(container.items[0].style['background-color'], '!=', container.style['background-color']);
            ctx.assert(container.items[1].style['background-color'],  '=', container.style['background-color']);
        });

        var tmpl = {
            'type': 'Container',
            'style': {
                'width': '70px', 'height': '96px',
                'left': '128px', 'top': '4px',
                'background-color': '#f08040',
                'border':'#401000 2px solid'
            },
            'title': 'Default',
            'items': [
                {
                    'type': 'Label',
                    'value': 'Hello',
                    'style': {
                        'left': '16px', 'top': '2px', 'align': 'center middle',
                        'width':'34px', 'height':'1.6em',
                        'color': '#e0e0f0',
                        'background-color': '#102080'
                    }
                },
                {
                    'type': 'Image',
                    'style': {
                        'left': '0em', 'top': '2em',
                        'width':'66px', 'height':'48px',
                        'border':'#4080e0 1px solid'
                    },
                    'source': 'res/test.png'
                }
            ]
        };
        var cnt = await glui.create('cnt', tmpl, container, null);
        container.render();
        glui.animate();

        await button('Next');
        teardown();
    }

    async function test_table() {
        header('Test table');
        await setup();

        //#region Table #1
        var tableTemplate1 = {
            'type': 'Table',
            'title':'Default',
            'show-header':false,
            'title-style':	{ 'color':'black' },
            'style': tableStyles.table
        };
        var table1 = glui.create('table1', tableTemplate1, null, App); table1.build();
        table1.addHandler('mouseout', table1, e => {debug_('table1.onmouseout', 0); return false;});
        test('Default table should have 2 colums and 2 rows', ctx => {
            ctx.assert(table1.rowCount, '=', 2);
            ctx.assert(table1.columnCount, '=', 2);
            ctx.assert(table1.rowKeys, ':=', [0,1]);
            ctx.assert(table1.columnKeys, ':=', ['0','1']);
            ctx.assert(table1.rows[0].constructor.name, '=', 'Row');
            ctx.assert(table1.rows[1].constructor.name, '=', 'Row');
            ctx.assert(table1.getCell(0, 0).constructor, '=', glui.Label);
            ctx.assert(table1.getCell(0, 1).constructor, '=', glui.Label);
            ctx.assert(table1.getCell(1, 0).constructor, '=', glui.Label);
            ctx.assert(table1.getCell(1, 1).constructor, '=', glui.Label);
        });
        table1.getCell(0, 0).setValue('0');
        table1.getCell(0, 1).setValue('1');
        table1.getCell(1, 0).setValue('2');
        table1.getCell(1, 1).setValue('3');
        table1.move(60, 60);
        table1.render();
        //#endregion

        //#region Table #2
        var tableTemplate2 = {
            'type': 'Table',
            'style': tableStyles.table,
            'title': '3x4',
            'cols': 3,
            'rows': 4,
            'show-header':false,
            'title-style':	tableStyles.title,
            'cell-template': {
                'type': 'Textbox',
                'data-type': 'string',
                'style': tableStyles.cell
            }
        };
        var table2 = glui.create('table2', tableTemplate2, null, App); table2.build();
        test('3x4 table should have 3 colums and 4 rows', ctx => {
            ctx.assert(table2.rowCount, '=', 4);
            ctx.assert(table2.columnCount, '=', 3);
            ctx.assert(table2.rowKeys, ':=', [0,1,2,3]);
            ctx.assert(table2.columnKeys, ':=', ['0','1','2']);
            for (var ri=0; ri<table2.rowCount; ri++) {
                ctx.assert(table2.rows[ri].constructor.name, '=', 'Row');
                for (var ci=0; ci<table2.columnCount; ci++) {
                    var cell = table2.getCell(ri, ci);
                    ctx.assert(cell.constructor, '=', glui.Textbox);
                    cell.setValue(ri+'_'+ci);
                }
            }
        });
        table2.move(240, 60);
        table2.render();
        //#endregion

        //#region Table #3
        var tableTemplate3 = {
            'type': 'Table',
            'title': 'Data-source (table)',
            'data-source': 'data',
            'data-field': 'table',
            'show-header': true,
            'style': {
                'align':'center middle',
                'font': 'Arial 16',
                'width': '20em',
                'color':'black',
                'border':'#c0e0ff 1px outset',
                'background-color': '#c0e0ff'
            },
            'cell-template': {
                'type': 'Label',
                'data-type': 'string',
                'style': {
                    'font': 'Arial 12',
                    'height':'1.2em',
                    'align':'left middle',
                    'background-image': 'none'
                }
            },
            'title-style':	{ 'align':'center middle', 'font': 'Arial 16 bold', 'height': '2em', 'color':'black' },
            'header-style':	{ 'align':'center middle', 'font': 'Arial 14 bold', 'height': '1.6em', 'color':'darkslategray' }
        };

        var table3 = glui.create('table3', tableTemplate3, null, App); table3.build();
        test('Table built from datasource should have 2 columns and ' + data.table.length + ' rows', ctx => {
            ctx.assert(table3.rowCount, '=', Object.keys(data.table).length);
            ctx.assert(table3.columnCount, '=', 3);
            ctx.assert(table3.rowKeys, ':=', Object.keys(data.table));
            ctx.assert(table3.columnKeys, ':=', ['name', 'age', 'rank']);
            for (var ri=0; ri<table3.rowCount; ri++) {
                ctx.assert(table3.rows[ri].constructor.name, '=', 'Row');
                for (var ci=0; ci<table3.columnCount; ci++) {
                    var cell = table3.getCell(ri, ci);
                    ctx.assert(cell.constructor, '=', glui.Label);
                }
            }
        });
        table3.move(420, 60);
        table3.render();
        //#endregion

        //#region Table #4
        var tableTemplate4 = {
            'type': 'Table',
            'title': 'Data-source (board)',
            'cols': 3,
            'data-source': 'data',
            'data-field': 'list',
            'mode': glui.Table.modes.BOARD,
            'style': {
                'align':'center middle',
                'font': 'Arial 12',
                'width': '28em',
                'color':'black',
                'border':'#c0e0ff 1px outset',
                'background-color': '#c0e0ff'
            },
            'cell-template': {
                'type': 'Label',
                'data-type': 'string',
                'style': {
                    'height':'1.5em',
                    'align':'center middle',
                    'background-image': 'none'
                }
            },
            'title-style':	{ 'align':'center middle', 'font': 'Arial 14 bold', 'height': '2em', 'color':'blue' }
        };
        var table4 = glui.create('table4', tableTemplate4, null, App); table4.build();
        var cols = tableTemplate4.cols;
        var rows = Math.ceil(data.table.length/cols);
        test('Table built from datasource should have ' + cols + ' columns and ' + rows + ' rows', ctx => {
            ctx.assert(table4.columnCount, '=', cols);
            ctx.assert(table4.rowCount, '=', rows);
            ctx.assert(table4.rowKeys, ':=', new Array(rows).fill(0).map((v,i) => i));
            ctx.assert(table4.columnKeys, ':=', new Array(cols).fill(0).map((v,i) => i.toString()));
            for (var ri=0; ri<table4.rowCount; ri++) {
                ctx.assert(table4.rows[ri].constructor.name, '=', 'Row');
                for (var ci=0; ci<table4.columnCount; ci++) {
                    var cell = table4.getCell(ri, ci);
                    ctx.assert(cell.constructor, '=', glui.Label);
                }
            }
        });
        table4.move(620, 60);
        table4.render();
        //#endregion

        //#region Table #5
        var tableTemplate5 = {
            'type': 'Table',
            'title':'Table (data binding)',
            'show-header':true,
            'title-style':	{ 'color':'black' },
            'style': tableStyles.table,
            'header-style': tableStyles.header,
            'cell-template': {
                'type':'Label',
                'style': tableStyles.cell
            },
            'row-template': {
                'name': { 'id':'name', 'type':'Label', 'data-field':'name' },
                'age': { 'id':'age', 'type':'Label', 'data-field':'age' }
            }
        };
        var table5 = glui.create('table5', tableTemplate5, null, App); table5.build();
        table5.dataBind(data, 'table'); table5.build();
        test(`Table should have 2 colums and ${data.table.length} rows`, ctx => {
             ctx.assert(table5.rowCount, '=', data.table.length);
             ctx.assert(table5.columnCount, '=', 2);
        //     ctx.assert(table1.rowKeys, ':=', [0,1]);
        //     ctx.assert(table1.columnKeys, ':=', ['0','1']);
        //     ctx.assert(table1.rows[0].constructor.name, '=', 'Row');
        //     ctx.assert(table1.rows[1].constructor.name, '=', 'Row');
        //     ctx.assert(table1.getCell(0, 0).constructor, '=', glui.Label);
        //     ctx.assert(table1.getCell(0, 1).constructor, '=', glui.Label);
        //     ctx.assert(table1.getCell(1, 0).constructor, '=', glui.Label);
        //     ctx.assert(table1.getCell(1, 1).constructor, '=', glui.Label);
        });
        table5.move(828, 60);
        //#endregion

        glui.animate();

        await button('Next');
        var ix = iterate(table3.rows, (k, v) => {
            return v.cells.name.getValue() == 'Blange';
        });
        //var value = table3.rows[ix].cells.name.value;
        table3.rows[ix].cells.name.setValue('Blanche');
        test('Entry change in Table3 should be reflected in the data source as well', ctx => ctx.assert(table3.rows[ix].cells.name.getValue(), '=', data.table[ix].name));

        await button('Next');
        teardown();
    }

    async function test_menu() {
        header('Test menu');

        await setup();
        // #region menu created manually
        var mainMenu = await glui.create('mainMenu', {
            'type': 'Menu',
            'layout': 'horizontal',
            'style': menuStyle,
            'item-template': menuItemTemplate
        }, null, App);
        var fileMenu = await glui.create('file', {
            'type': 'Menu',
            'style': menuStyle,
            'label': 'File',
            'key': 'ALT F',
            'item-template': menuItemTemplate
        }, mainMenu);
        var resMenu = await glui.create('resMenu', {
            'type': 'Menu',
            'layout': 'vertical',
            'style': menuStyle,
            'label': 'Open',
            'item-template': menuItemTemplate
        }, fileMenu);
        await resMenu.add('Resource1');
        await resMenu.add('Resource2');
        await resMenu.build();
        await fileMenu.add('Save', null, 'CTRL S');
        await fileMenu.build();
        var editMenu = await glui.create('edit', {
            'type': 'Menu',
            'style': menuStyle,
            'label': 'Edit',
            'key': 'ALT F',
            'item-template': menuItemTemplate
        }, mainMenu);
        await editMenu.add('Cut', null, 'CTRL X');
        await editMenu.add('Copy', null, 'CTRL C');
        await editMenu.add('Paste', null, 'CTRL V');
        await editMenu.build();
        await mainMenu.add('Help', 'HELP', 'ALT H');
        await mainMenu.build();
        mainMenu.move(10, 10);
        mainMenu.render();
        glui.animate();
        await button('Next');
        glui.remove(mainMenu);
        //#endregion

        glui.repaint();

        //#region menu created from data
        var mainMenu2 = await glui.create('mainMenu2', {
            'type': 'Menu',
            'layout': 'horizontal',
            'style': menuStyle,
            'item-template': menuItemTemplate
        }, null, App);
        await mainMenu2.build(data['main-menu']);
        mainMenu2.move(10, 10);
        mainMenu2.render();
        glui.animate();
        await button('Next');
        //#endregion

        teardown();
    }

    async function test_dialog() {
        header('Test dialogs');
        await setup();
        glui.animate();
        
        // generic dialog
        var dlg = glui.create('dlg01', {
            'type':'Dialog',
            'title': 'Generic Dialog...',
            'style': {
                'font': 'Arial 16',
                'width':'14em', 'height':'6.4em',
                //'padding':'1.0em',
                'align':'left middle',
                'border':'#204080 1px inset',
                'background-color': '#4080ff',
                'background-image': 'none',
                'color':'white'
            },
            'title-style': {
                'font': 'Arial 14',
                'color': '#00e0ff',
                'background-color': '#2040c0',
                'border':'#2040c0 1px outset'
            },
            'items': [
                {   'type': 'Label',
                    'style': {
                        'left':'0.5em', 'top':'0.5em',
                        'width':'6.4em', 'height':'1.6em',
                        'align':'center middle',
                        'border':'#908070 1px outset',
                        'background-color': '#908070',
                        'background-image': 'none'
                    },
                    'value': 'Count'
                },
                {   'type': 'Textbox',
                    'id': 'Score',
                    'style': {
                        'left':'7.2em', 'top':'0.5em',
                        'width':'6em', 'height':'1.6em',
                        'align':'right middle',
                        'border':'#008000 1px inset',
                        'background-color': '#008000',
                        'background-image': 'none'
                    },
                    'look': 'textbox',
                    'data-type': 'int',
                    'decimal-digits': 0,
                    'data-source': 'data',
                    'data-field': 'textbox2'
                },
                {   'type': 'Button',
                    'id': 'Ok',
                    'style': {
                        'left':'4em', 'top':'2.4em',
                        'width':'6em', 'height':'2em',
                        'align':'center middle',
                        'border':'#6080e0 2px',
                        'background-color': '#6080e0'
                    },
                    'value': 'Ok'
                }
            ],
            'init': function() {
                this.move(100, 100);
                // //var lbl = this.items[0];
                // //lbl.move('0em', '0em');
                // var tb = this.items[1];
                // tb.move('7em', '0em');
                var bt = this.items[2];
                bt.addHandler('click', this, function(e, ctrl) {
                    Dbg.prln('Close it!');
                    this.close();
                    return true;
                });
            }
        }, null, App);
        await dlg.open();

        // var openSaveDialog = glui.create('OpenDialog', {
        //     'title': 'Open image...',
        //     'filters': {
        //         'images': '*.png;*.jpg',
        //         'all files': '*.*'
        //     },
        //     'init': function() {
        //             this.move(100, 100);
        //         }
        //     }, null, App
        // );
        // selected.bindData([
        //     { 'name':'image01.png', 'size':12678 },
        //     { 'name':'image02.jpg', 'size':8754 },
        //     { 'name':'image03.gif', 'size':24895 },
        //     { 'name':'image04.png', 'size':27856 },
        //     { 'name':'image01.txt', 'size':17452 },
        //     { 'name':'notes.txt', 'size':2456 }
        // ]);
        // var selected = await openSaveDialog.open();
        // Dbg.prln('Selected image: ' + selected);

        // await glui.checkPendings();
        // glui.render();

        await button('Next');
        teardown();
    }

    async function test_grid() {
        header('Test grid');
        await setup();

        var tmpl = controls.find( x => x.type == 'Grid');
        var grid = await glui.create('grid', tmpl, null, App);

        grid.render();

        glui.animate();

        await button('Next');
        teardown();
    }

    // function test_valueControls() {
    //     header('Test value-controls');
    //     var i = 1;
    //     for (var i=0; i<controls.length; i++) {
    //         var type = controls[i];
    //         var id = `ctrl${i}`;
    //         var control = null;
    //         test(`Can construct ${type} directly`, ctx => {
    //             control = Reflect.construct(glui[glui.getTypeName(type)], [id, null, null]);
    //             ctx.assert(control, '!=', null);
    //             ctx.assert(control.id, '=', id);
    //         });

    //         if (!control) return;
    //         var link = null;
    //         test('Can bind data', ctx => {
    //             link = control.dataBind(_data1, 'value');
    //             ctx.assert(link, '!=', null);
    //             ctx.assert(control.getValue(), '=', _data1.value);
    //         });

    //         if (!link) return;
    //         test("Changing data source modifies control's value", ctx => {
    //             link.value = 2;
    //             ctx.assert(control.value, '=', 2);
    //         });
    //         test("Changing control's value modifies data source", ctx => {
    //             control.setValue(4);
    //             ctx.assert(_data1.value, '=', 4);
    //         });

    //         i++;
    //     }
    // }

    var tests = () => [
        // test_clipping,
        // test_construct,
        // test_align,
        // test_container,
        test_table,
        // test_menu,
        // test_render,
        // test_grid,
        // test_dialog
    ];
    publish(tests, 'glUi tests');
})();
