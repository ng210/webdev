include('glui/glui-lib.js');
include('data/dataseries.js');
(function() {

    var style = {
        'font': 'Arial 12',
        'width':'10em', 'height':'1.5em',
        'align':'right middle',
        'border':'#406080 1px inset',
        'background': '#c0e0ff',
        'background-image': 'none'
    };
    var buttonStyle = {
        'font': 'Arial 12',
        'width':'14em', 'height':'2em',
        'align':'center middle',
        'border':'#808090 2px',
        'background': '#a0a0b0'
    };
    var tableStyle = {
        'font': 'Arial 20',
        'width':'14em',
        'align':'center middle',
        'border':'#308060 6px outset',
        'color': '#184030',
        'background': '#308060',
        'cell': {
            'font': 'Arial 14',
            'align':'center middle',
            'border':'#90b0c0 1px inset',
            'color': '#102040',
            'background': '#90b0c0',
            'width': '4em'
        },
        'title': {
            'font': 'Arial 16',
            'border':'#60a080 1px inset',
            'color': '#204060',
            'background': '#80c0a0',
            'height': '1.5em'
        },
        'header': {
            'font': 'Arial 12',
            'height':'2.0em',
            'align':'center middle',
            'border':'#60a080 2px outset',
            'color': '#000000',
            'background': '#60a080'
        }
    };
    var comboboxStyle = {
        'font': 'Arial 15',
        'align':'center middle',
        'border':'#7090c0 2px solid',
        'color': '#102040',
        'background': '#90b0c0',
        'width': '10em'
    };

    var controls = [
        {
            'type': 'Label',
            'style': style,
            'value': 'label'
        },
        {
            'type': 'Label',
            'style': style,
            'data-source': 'data',
            'data-field': 'label1'
        },
        {
            'type': 'Label',
            'style': style,
            'data-type': 'int',
            'decimal-digits': 2,
            'data-source': 'data',
            'data-field': 'label2'
        },

        {
            'type': 'Textbox',
            'style': style,
            'look': 'textbox',
            'decimal-digits': 3,
            'value': 'textbox'
        },
        {
            'type': 'Textbox',
            'style': style,
            'look': 'textbox',
            'decimal-digits': 3,
            'data-source': 'data',
            'data-field': 'textbox1'
        },
        {
            'type': 'Textbox',
            'style': style,
            'look': 'potmeter',
            'data-type': 'int',
            'decimal-digits': 1,
            'data-source': 'data',
            'data-field': 'textbox2'
        },

        {
            'type': 'Button',
            'style': buttonStyle,
            'data-source': 'data',
            'data-field': 'button'
        },

        {
            'type': 'Image',
            'style': {
                'width':'128px', 'height':'96px',
                'border':'#805020 2px inset',
                'background': '#102040'
            },
            'source': 'glui/res/test.png'
        },

        {
            'type': 'Grid',
            'style': {
                'color': '#ffd080',
                'background': '#102040',
                'width': '640px', 'height': '400px',
                'border': '#102040 2px inset'
            },
            'unit-x': 8,
            'unit-y': 8,
            'data-source': 'data',
            'data-field': 'grid',
            'insert-mode': 'x-bound',
            'drag-mode': 'free',
            'curve-mode': 'line',
            'scale-x': 2.0,
            'scale-y': 2.0
        }

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
        //         'name': { 'type': 'Label', 'style': { 'width':'65%', 'background': '#60c0a0', 'border':'#60c0a0 2px inset' } },
        //         'age': { 'type': 'Textbox', 'data-type': 'int', 'style': { 'width':'35%', 'background': '#d0fff0', 'border':'#608078 1px inset' } }
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
        'list': [ 'James', 'Ivy',  'Alfred', 'Henry', 'Blange', 'Wilson', 'George', 'Teddy', 'Sissy', 'Poppy' ],
        'grid': [
            { 'x': 5, 'y': 5, 'value': 0.1},
            { 'x':15, 'y':11, 'value': 0.3},
            { 'x':25, 'y': 6, 'value': 0.4},
            { 'x':35, 'y':12, 'value': 0.2},
            { 'x':45, 'y': 7, 'value': 0.4},
            { 'x':55, 'y':13, 'value': 0.2}
        ],
        'combobox': 'James'
    };

    var App = {
        onclick: function onclick(e, ctrl) {
            if (ctrl instanceof glui.Button) {
                switch (ctrl.value) {
                    case 'Complete':
                        Dbg.prln('End test');
                        isComplete = true;
                        break;
                    default:
                        Dbg.prln('Click');
                        break;
                }
            }
        },
        onchange: function onchange(e, ctrl) {
            Dbg.prln(`Changed ${ctrl.id}.value: ${e.oldValue} => ${e.value}`);
        },
        isInitialized: false
    };

    async function setup() {
        if (!App.isInitialized) {
            glui.scale.x = 0.6;
            glui.scale.y = 0.6;
            await glui.initialize(App, true);
            await glui.setRenderingMode(glui.Render2d);
            App.isInitialized = true;
        }
        glui.buildUI(App);
        glui.repaint();
    }

    function teardown() {
        glui.reset();
    }

    async function createControls() {
        var top = glui.screen.renderer.convertToPixel('3em', true), left = 10;
        var width = 0;
        for (var i=0; i<controls.length; i++) {
            var ctrl = await glui.create(`${controls[i].type}${i}`, controls[i], null, App);
            if (ctrl instanceof glui.Table) {
                await ctrl.build();
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
        message('Test clipping', 1);
        await setup();
        var tmpl1 = {
            'type': 'Table',
            'style': {
                'font': 'Arial 20',
                'width':'14em', 'height':'4em',
                'align':'center middle',
                'border':'#308060 2px outset',
                'color': '#184030',
                'background': '#308060'
            },
            'cell-template': {
                'font': 'Arial 2',
                'width':'8em', 'height':'1.2em',
                'align':'center middle',
                'border':'#308060 1px inset',
                'color': '#184030'
            },
            'cols': 3,
            'data-source': 'data',
            'data-field': 'list'
        }

        var cnt = await glui.create('cnt1', tmpl1, null, App); await cnt.build();
        cnt.render();
        glui.animate();
        await button('Next');
        glui.screen.remove(cnt);
    }

    async function test_construct() {
        message('Test construct', 1);
        await setup();
        await createControls();
        for (var i=0; i<glui.screen.items.length; i++) {
            var control = glui.screen.items[i];
            test(`Should create <b><i>${control.type}</i></b> from template`, ctx => {                
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
        }

        teardown();
    }

    async function test_render() {
        message('Test rendering', 1);
        await setup();
        await createControls();
        glui.repaint();
        glui.animate();

        await button('Next');

        teardown();
    }

    async function test_container() {
        message('Test container', 1);
        await setup();    
        var containerTemplate = {
            'type': 'Container',
            'style': {
                'left': '10px', 'top': '4em',
                'width': '40em', 'height': '16em',
                'background': '#8080f0',
                'border':'#404080 2px outset',
                'z-index': 0
            },
            'title': 'Default',
            'items': {
                'Text': {
                    'type': 'Textbox',
                    'style': {
                        'left': '1em', 'top': '1em',
                        'width':'10em', 'height':'2em',
                        'border':'#c0c0e0 1px inset',
                        'color': '#e0e0f0',
                        'background': '#102040'
                    },
                    'look': 'textbox',
                    'decimal-digits': 3,
                    'data-source': 'data',
                    'data-field': 'textbox1'
                },
                'Image': {
                    'type': 'Image',
                    'style': {
                        'left': '1em', 'top': '4em',
                        'width':'96px', 'height':'96px',
                        'border':'#c0c0f0 2px solid'
                    },
                    'source': 'glui/res/test.png'
                }
            }
        };
        var container = await glui.create('container1', containerTemplate, null, App);
        test('Container has a Textbox and an Image item', ctx => {
            ctx.assert(container.items.length, '=', 2);
            ctx.assert(container.items[0].constructor, '=', glui.Textbox);
            ctx.assert(container.items[1].constructor, '=', glui.Image);
        });

        var tmpl = {
            'type': 'Container',
            'style': {
                'width': '70px', 'height': '96px',
                'left': '128px', 'top': '4px',
                'background': '#f08040',
                'border':'#401000 2px solid'
            },
            'title': 'Default',
            'items': {
                'Label': {
                    'type': 'Label',
                    'value': 'Hello',
                    'style': {
                        'left': '16px', 'top': '2px', 'align': 'center middle',
                        'width':'34px', 'height':'1.6em'
                    }
                },
                'Image': {
                    'type': 'Image',
                    'style': {
                        'left': '0em', 'top': '2em',
                        'width':'66px', 'height':'48px',
                        'border':'#4080e0 1px solid'
                    },
                    'source': 'glui/res/test.png'
                }
            }
        };
        var cnt = await glui.create('cnt', tmpl, container, null);

        container.render();
        glui.animate();

        await button('Next');
        teardown();
    }

    async function test_table() {
        message('Test table', 1);
        await setup();

        var tableTemplate1 = {
            'type': 'Table',
            'style': tableStyle,
            'title': 'Default'
        };
        var table1 = await glui.create('table1', tableTemplate1, null, App); await table1.build();
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

        var tableTemplate2 = {
            'type': 'Table',
            'style': tableStyle,
            'title': '3x4',
            'cols': 3,
            'rows': 4,
            'cell-template': {
                'type': 'Textbox',
                'data-type': 'string',
                'style': {
                    'font': 'Arial 10',
                    'width':'2em', 'height':'2.2em',
                    'align':'left middle',
                    'border':'#406080 1px inset',
                    'background': '#f0f0cf',
                    'background-image': 'none'
                }
            }
        };
        var table2 = await glui.create('table2', tableTemplate2, null, App); await table2.build();
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

        var tableTemplate3 = {
            'type': 'Table',
            'style': tableStyle,
            'title': 'Data-source (table)',
            'data-source': 'data',
            'data-field': 'table',
            'header': true
        };
        var table3 = await glui.create('table3', tableTemplate3, null, App); await table3.build();
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

        var tableTemplate4 = {
            'type': 'Table',
            'style': {},
            'title': 'Data-source (board)',
            'cols': 3,
            'data-source': 'data',
            'data-field': 'list'
        };

        tableTemplate4.style = mergeObjects(tableStyle);
        tableTemplate4.style.height = '';
        var table4 = await glui.create('table4', tableTemplate4, null, App); await table4.build();
        test('Table built from datasource should have 2 columns and ' + data.table.length + ' rows', ctx => {
            ctx.assert(table4.columnCount, '=', 3);
            ctx.assert(table4.rowCount, '=', Math.ceil(Object.keys(data.list).length/table4.columnCount));
            ctx.assert(table4.rowKeys, ':=', [0, 1, 2, 3]);
            ctx.assert(table4.columnKeys, ':=', ['0', '1', '2']);
            for (var ri=0; ri<table4.rowCount; ri++) {
                ctx.assert(table4.rows[ri].constructor.name, '=', 'Row');
                for (var ci=0; ci<table4.columnCount; ci++) {
                    var cell = table4.getCell(ri, ci);
                    ctx.assert(cell.constructor, '=', glui.Label);
                }
            }
        });
        table4.move(600, 60);
        table4.render();

        glui.animate();

        await button('Next');
        teardown();
    }

    function test_mergeObjects() {
        message('Test mergeObjects', 1);
        var person = {
            "id": 12,
            "name": "James",
        };
        var itemList = {
            "id": 113,
            "items": [
                { "name": "knife", "value": 10 },
                { "name": "bottle", "value": 5 }            
            ]
        };

        test('should merge 2 objects', ctx => {
            var merged = mergeObjects(itemList, person);
            var expected = {
                "id": 12,
                "name": "James",
                "items": [
                    { "name": "knife", "value": 10 },
                    { "name": "bottle", "value": 5 }            
                ]
            };
            ctx.assert(merged, ':=', expected);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
        });

        test('should merge 2 objects keep source only', ctx => {
            var merged = mergeObjects(itemList, person, true);
            var expected = {
                "id": 12,
                "items": [
                    { "name": "knife", "value": 10 },
                    { "name": "bottle", "value": 5 }            
                ]
            };
            ctx.assert(merged, ':=', expected);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
        });

        test('should merge an object with null', ctx => {
            var merged = mergeObjects(null, person);
            var expected = {
                "id": 12,
                "name": "James"
            };
            ctx.assert(merged, ':=', expected);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
        });

        test('should merge an object with null subobject', ctx => {
            var merged = mergeObjects({"id": 12, "items": null}, itemList);
            var expected = {
                "id": 113,
                "items": [
                    { "name": "knife", "value": 10 },
                    { "name": "bottle", "value": 5 }            
                ]
            };
            ctx.assert(merged, ':=', expected);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
        });
     
        test('should clone an object', ctx => {
            var expected = {
                "id": 12,
                "name": "James"
            };
            var merged = mergeObjects(person);
            ctx.assert(merged, ':=', person);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
        });
    }

    function test_getObjectAt() {
        message('Test get object', 1);
        test('Should get object at path', context => {
            context.assert(getObjectAt('data.label1'), '=', data.label1);
            context.assert(getObjectAt('label1', data), '=', data.label1);
            context.assert(getObjectAt('data.table.0.name'), '=', data.table[0].name);
        });
    }

    async function test_grid() {
        message('Test grid', 1);
        await setup();

        var tmpl = controls.find( x => x.type == 'Grid');
        var grid = await glui.create('grid', tmpl, null, App);

        grid.render();

        glui.animate();

        await button('Next');
    }

    // function test_valueControls() {
    //     message('Test value-controls', 1);
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
        test_mergeObjects,
        test_getObjectAt,
        test_clipping,
        test_construct,
        test_container,
        test_table,
        // test_render,

        test_grid
    ];
    publish(tests, 'glUi tests');
})();