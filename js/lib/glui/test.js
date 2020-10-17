include('glui/glui-lib.js');
(function() {

    var isComplete = false;

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
    var gridStyle = {
        'font': 'Arial 20',
        'width':'14em', 'height':'5em',
        'align':'center middle',
        'border':'#308060 2px outset',
        'color': '#184030',
        'background': '#308060',
        'cell': {
            'font': 'Arial 14',
            'align':'center middle',
            'border':'#7090c0 1px inset',
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
            'font': 'Arial 14',
            'height':'2.0em',
            'align':'center middle',
            'border':'#60a080 1px outset',
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
            'value': 'Complete'
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
        // {
        //     'type': 'Grid',
        //     'style': gridStyle,
        //     'title': 'Default'
        // },
        // {
        //     'type': 'Grid',
        //     'style': gridStyle,
        //     'title': 'Empty 3x2',
        //     'rows': 2,
        //     'cols': 3
        // },
        // {
        //     'type': 'Grid',
        //     'style': gridStyle,
        //     'title': 'Characters 4x2',
        //     'data-source': 'data',
        //     'data-field': 'grid',
        //     'rows': 4,
        //     'cols': 2,
        //     'header': false,
        //     'row-template': {
        //         'name': { 'type': 'Label', 'column': '$Key', 'style': {
        //             'width':'65%', 'background': '#60c0a0', 'border':'#60c0a0 1px inset'
        //         } },
        //         'age': { 'type': 'Textbox', 'data-type': 'int', 'column': '$Key', 'style': {
        //             'width':'35%', 'background': '#d0fff0', 'border':'#608078 1px inset'
        //         } }
        //     }
        // },
        // {
        //     'type': 'Grid',
        //     'style': gridStyle,
        //     'title': 'Characters 3x8',
        //     'data-source': 'data',
        //     'data-field': 'grid',
        //     'rows': 8,
        //     'cols': 3,
        //     'header': false,
        //     'row-template': {
        //         'name': { 'type': 'Label', 'column': '$Key', 'style': {
        //             'width':'65%', 'background': '#60c0a0', 'border':'#60c0a0 1px inset'
        //         } },
        //         'age': { 'type': 'Textbox', 'data-type': 'int', 'column': '$Key', 'style': {
        //             'width':'35%', 'background': '#d0fff0', 'border':'#608078 1px inset'
        //         } }
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
        //     'values': 'data.grid',
        //     'row-template': {
        //         'name': { 'type': 'Label', 'style': { 'width':'65%', 'background': '#60c0a0', 'border':'#60c0a0 2px inset' } },
        //         'age': { 'type': 'Textbox', 'data-type': 'int', 'style': { 'width':'35%', 'background': '#d0fff0', 'border':'#608078 1px inset' } }
        //     }
        // }
    ];

    window.data = {
        "label1": "Label Text",
        "label2": 10,
        "textbox1": "Textbox 1",
        "textbox2": 20,
        "button": "Button",
        "grid": [
            { "name": "James", "age": 38, "rank": 8 },
            { "name": "Ivy", "age": 32, "rank": 9 },
            { "name": "Alfred", "age": 61, "rank": 6 },
            { "name": "Henry", "age": 17, "rank": 10 },
            { "name": "Blange", "age": 60, "rank": 7 },
            { "name": "Wilson", "age": 62, "rank": 5 },
            { "name": "George", "age": 67, "rank": 1 },
            { "name": "Teddy", "age": 52, "rank": 2 },
            { "name": "Sissy", "age": 29, "rank": 3 },
            { "name": "Poppy", "age": 27, "rank": 4 }
        ],
        "combobox": "James"
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
        }
    };

    async function setup() {
        glui.scale.x = 0.8;
        glui.scale.y = 0.8;
        glui.initialize(App, true);
        await glui.setRenderingMode(glui.Render2d);
        glui.buildUI(App);
    }

    function teardown() {
        glui.shutdown();
    }

    async function createControls() {
        var top = glui.screen.renderer.convertToPixel('5em', true), left = 10;
        var width = 0;
        for (var i=0; i<controls.length; i++) {
            var ctrl = await glui.create(`${controls[i].type}${i}`, controls[i], null, App);
            if (ctrl instanceof glui.Image) {
                await ctrl.load();
            } else if (ctrl instanceof glui.Grid) {
                await ctrl.build();
            }
            ctrl.move(left, top);
            width = Math.max(width, parseFloat(ctrl.width));
            ctrl.getBoundingBox();
            top += 8 + parseFloat(ctrl.height);
            if (top > screen.height/4) {
                top = 10;
                left += width + 10;
                width = 0;
            }

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
        glui.resize(true);
        //glui.render();
    }

    async function test_construct() {
        await setup();
        await createControls();
        for (var i=0; i<glui.screen.items.length; i++) {
            var control = glui.screen.items[i];
            test(`Should create <b><i>${control.type}</i></b> from template`, ctx => {                
                ctx.assert(control, '!=', null);
                if (control instanceof glui.ValueControl) {
                    ctx.assert(control.id, '=', `${control.constructor.name}${i}`);
                    ctx.assert(control instanceof glui[controls[i].type], '=', true);
                    if (control.dataSource != null) {
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
        await setup();
        await createControls();
        renderUI();
        isComplete = false;
        await poll( () => isComplete, 100);
        glui.renderingContext2d.fillRect(0, 0, glui.canvas.width, glui.canvas.height);
        teardown();
    }

    async function test_grid() {
        message('Test grid creation', 1);
        await setup();

        var gridTemplate1 = {
            'type': 'Grid',
            'style': gridStyle,
            'title': 'Default'
        };
        var grid1 = await glui.create('grid1', gridTemplate1, null, App); await grid1.build();
        test('Default grid should have 2 colums and 2 rows', ctx => {
            ctx.assert(grid1.rowCount, '=', 2);
            ctx.assert(grid1.columnCount, '=', 2);
            ctx.assert(grid1.rowKeys, ':=', [0,1]);
            ctx.assert(grid1.columnKeys, ':=', [0,1]);
            ctx.assert(grid1.rows[0].constructor.name, '=', 'Row');
            ctx.assert(grid1.rows[1].constructor.name, '=', 'Row');
            ctx.assert(grid1.getCell(0, 0).constructor, '=', glui.Label);
            ctx.assert(grid1.getCell(0, 1).constructor, '=', glui.Label);
            ctx.assert(grid1.getCell(1, 0).constructor, '=', glui.Label);
            ctx.assert(grid1.getCell(1, 1).constructor, '=', glui.Label);
        });
        grid1.getCell(0, 0).setValue('0');
        grid1.getCell(0, 1).setValue('1');
        grid1.getCell(1, 0).setValue('2');
        grid1.getCell(1, 1).setValue('3');
        grid1.move(60, 90);
        grid1.render();

        var gridTemplate2 = {
            'type': 'Grid',
            'style': gridStyle,
            'title': '3x4',
            'cols': 3,
            'rows': 4
        };
        var grid2 = await glui.create('grid2', gridTemplate2, null, App); await grid2.build();
        test('3x4 grid should have 3 colums and 4 rows', ctx => {
            ctx.assert(grid2.rowCount, '=', 4);
            ctx.assert(grid2.columnCount, '=', 3);
            ctx.assert(grid2.rowKeys, ':=', [0,1,2,3]);
            ctx.assert(grid2.columnKeys, ':=', [0,1,2]);
            for (var ri=0; ri<grid2.rowCount; ri++) {
                ctx.assert(grid2.rows[ri].constructor.name, '=', 'Row');
                for (var ci=0; ci<grid2.columnCount; ci++) {
                    var cell = grid2.getCell(ri, ci);
                    ctx.assert(cell.constructor, '=', glui.Label);
                    cell.setValue(ri+'_'+ci);
                }
            }
        });
        grid2.move(240, 90);
        grid2.render();

        var gridTemplate3 = {
            'type': 'Grid',
            'style': gridStyle,
            'title': 'Data-source (table)',
            'data-source': 'data',
            'data-field': 'grid'
        };
        var grid3 = await glui.create('grid3', gridTemplate3, null, App); await grid3.build();
        test('Grid build from datasource should have 2 columns and datasource.length rows', ctx => {
            ctx.assert(grid3.rowCount, '=', Object.keys(data.grid).length);
            ctx.assert(grid3.columnCount, '=', 3);
            ctx.assert(grid3.rowKeys, ':=', Object.keys(data.grid));
            ctx.assert(grid3.columnKeys, ':=', ['name', 'age', 'rank']);
            for (var ri=0; ri<grid3.rowCount; ri++) {
                ctx.assert(grid3.rows[ri].constructor.name, '=', 'Row');
                for (var ci=0; ci<grid3.columnCount; ci++) {
                    var cell = grid3.getCell(ri, ci);
                    ctx.assert(cell.constructor, '=', glui.Label);
                }
            }
        });
        grid3.move(420, 90);
        grid3.render();

        // var gridTemplate4 = {
        //     'type': 'Grid',
        //     'style': gridStyle,
        //     'title': 'Data-source (list)',
        // };
        // var grid4 = await glui.create('grid4', gridTemplate4, null, App); grid4.dataBind(data.grid.map(x => x.name)); await grid4.build();
        // test('Grid build from datasource should have 3 columns and 4 rows', ctx => {
        //     ctx.assert(grid4.rowCount, '=', 5);
        //     ctx.assert(grid4.columnCount, '=', 2);
        //     ctx.assert(grid4.rowKeys, ':=', [0,1,2,3,4]);
        //     ctx.assert(grid4.columnKeys, ':=', [0,1]);
        //     for (var ri=0; ri<grid4.rowCount; ri++) {
        //         ctx.assert(grid4.rows[ri].constructor.name, '=', 'Row');
        //         for (var ci=0; ci<grid4.columnCount; ci++) {
        //             var cell = grid4.getCell(ri, ci);
        //             ctx.assert(cell.constructor, '=', glui.Label);
        //         }
        //     }
        // });
        // grid4.move(600, 90);
        // grid4.render();

        // var gridTemplate5 = {
        //     'type': 'Grid',
        //     'style': gridStyle,
        //     'title': 'Data-source',
        //     'data-source': 'data',
        //     'data-field': 'list',
        //     'cols': 2,
        //     'rows': 4
        // };
        // var grid5 = await glui.create('grid5', gridTemplate5, null, App); await grid5.build();
        // test('2x4 grid build from datasource should have 2 columns and 4 rows', ctx => {
        //     ctx.assert(grid5.rowCount, '=', 4);
        //     ctx.assert(grid5.columnCount, '=', 2);
        //     ctx.assert(grid5.rowKeys, ':=', Object.keys(data.grid).slice(0, 4).map(x => parseInt(x)));
        //     ctx.assert(grid5.columnKeys, ':=', [0,1]);
        //     for (var ri=0; ri<grid5.rowCount; ri++) {
        //         ctx.assert(grid5.rows[ri].constructor.name, '=', 'Row');
        //         for (var ci=0; ci<grid5.columnCount; ci++) {
        //             var cell = grid5.getCell(ri, ci);
        //             ctx.assert(cell.constructor, '=', glui.Label);
        //         }
        //     }
        // });
        // grid5.move(600, 90);
        // grid5.render();

        var tmpl = controls.find(x => x.type == 'Button' && x.value == 'Complete');
        var ctrl = await glui.create(`btn`, tmpl, null, App);
        ctrl.move(10, 300);
        ctrl.render();

        glui.animate();

        isComplete = false;
        await poll( () => isComplete, 100);
        teardown();
    }

    function test_mergeObjects() {
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
        test('Should get object at path', context => {
            context.assert(getObjectAt('data.label1'), '=', data.label1);
            context.assert(getObjectAt('label1', data), '=', data.label1);
            context.assert(getObjectAt('data.grid.0.name'), '=', data.grid[0].name);
        });
    }

    function test_valueControls() {
        var i = 1;
        for (var type in controls) {
            var id = `ctrl${i}`;
            var control = null;
            test(`Can construct ${type} directly`, ctx => {
                control = Reflect.construct(glui[glui.getTypeName(type)], [id, null, null]);
                ctx.assert(control, '!=', null);
                ctx.assert(control.id, '=', id);
            });

            if (!control) return;
            var link = null;
            test('Can bind data', ctx => {
                link = control.dataBind(_data1, 'value');
                ctx.assert(link, '!=', null);
                ctx.assert(control.getValue(), '=', _data1.value);
            });

            if (!link) return;
            test("Changing data source modifies control's value", ctx => {
                link.value = 2;
                ctx.assert(control.value, '=', 2);
            });
            test("Changing control's value modifies data source", ctx => {
                control.setValue(4);
                ctx.assert(_data1.value, '=', 4);
            });

            i++;
        }
    }

    var tests = () => [
        //test_mergeObjects,
        //test_getObjectAt,
        //test_construct,
        test_grid,
        //test_valueControls,
        //test_render
    ];
    publish(tests, 'glUi tests');
})();