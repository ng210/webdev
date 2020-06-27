include('glui/glui-lib.js');
(function() {

    var isComplete = false;

    var style = {
        'font': 'Arial 12',
        'width':'10em', 'height':'1.75em',
        'align':'right middle',
        'border':'#406080 1px inset',
        'background': '#c0e0ff'
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
        'width':'18em', // 'height':'15em',
        'align':'center middle',
        'border':'#308060 4px solid',
        'color': '#401020',
        'background': '#60c0a0',
        'title': {
            'font': 'Arial 16',
            'border':'#60a080 1px inset',
            'color': '#204060',
            'background': '#80c0a0',
        },
        'header': {
            'font': 'Arial 22',
            'height':'2.5em',
            'align':'center middle',
            'border':'#60a080 2px outset',
            'color': '#000000',
            'background': '#60a080'
        }
    };

    var renderer = null;

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

        {
            'type': 'Grid',
            'style': gridStyle,
            'title': 'Characters',
            'data-source': 'data',
            'data-field': 'grid',
            'row-template': {
                'name': { 'type': 'Label', 'column': '$Key', 'style': {
                    'width':'65%', 'background': '#60c0a0', 'border':'#60c0a0 1px inset'
                } },
                'age': { 'type': 'Textbox', 'data-type': 'int', 'column': '$Key', 'style': {
                    'width':'35%', 'background': '#d0fff0', 'border':'#80a890 1px inset'
                } }
            }
        }
    ];

    window.data = {
        "label1": "Label Text",
        "label2": 10,
        "textbox1": "Textbox 1",
        "textbox2": 20,
        "button": "Button",
        "grid": [
            { "name": "James", "age": 36 },
            { "name": "Ivy", "age": 32 },
            { "name": "Alfred", "age": 61 },
        ]
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

    function setup() {
        glui.scale.x = 0.5;
        glui.scale.y = 0.5;
        glui.initialize(App, true);
        glui.setRenderingMode(glui.Render2d);
        glui.buildUI(App);
    }

    function teardown() {
        glui.shutdown();
        renderer = null;
    }

    async function createControls() {
        for (var i=0; i<controls.length; i++) {
            var ctrl = glui.create(`ctrl${i}`, controls[i], null, App);
            if (ctrl instanceof glui.Image) {
                await ctrl.load();
            }
        }
    }

    function renderUI() {
        var ctx = glui.setRenderingMode(glui.Render2d);
        renderer = new glui.Renderer2d(null, ctx);
        renderer.setFont('Arial 12 normal');
        
        var top = renderer.convertToPixelV('5em'), left = 10;
        var width = 0;
        for (var i=0; i<glui.controls.length; i++) {
            var ctrl = glui.controls[i];
            if (ctrl.parent == null) {
                ctrl.move(left, top);
                width = Math.max(width, parseFloat(ctrl.width));
                ctrl.getBoundingBox();
                top += 8 + parseFloat(ctrl.height);
                if (top > screen.height/2) {
                    top = 10;
                    left += width + 10;
                    width = 0;
                }
            }
        }
        glui.resize(true);
        glui.animate();
    }

    async function test_construct() {
        setup();
        await createControls();
        for (var i=0; i<glui.controls.length; i++) {
            var control = glui.controls[i];
            test(`Should create <b><i>${control.type}</i></b> from template`, ctx => {                
                ctx.assert(control, '!=', null);
                if (control instanceof glui.ValueControl) {
                    ctx.assert(control.id, '=', `ctrl${i}`);
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
        setup();
        await createControls();
        renderUI();
        await poll( () => isComplete, 100);
        glui.renderingContext2d.fillRect(0, 0, glui.canvas.width, glui.canvas.height);

        teardown();
    }

    function test_mergeFields() {
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
            var merged = glui.Control.mergeFields(itemList, person);
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

        test('should clone an object', ctx => {
            var expected = {
                "id": 12,
                "name": "James"
            };
            var merged = glui.Control.mergeFields(person);
            ctx.assert(merged, ':=', person);
            merged.id = 1;
            ctx.assert(merged.id, '!=', expected.id);
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
        test_mergeFields,
        test_construct,
        //test_valueControls,
        test_render
    ];
    public(tests, 'glUi tests');
})();