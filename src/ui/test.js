include('/ui/ui-lib.js');
(function() {

    function test_dataLink() {
        var results = ['DataLink tests'];

        // setup
        var obj = {'id': 1, 'name': 'Test User'};
        var dl = new Ui.DataLink(obj);
        var newValue = 2;
        var expected = [newValue, obj.id, 'id'];
        var received = [];

        dl.add('id', (value, oldValue, field) => received.push(value, oldValue, field));
        results.push(
            test('Create datalink object', () => dl.obj != obj ? ["Objects don't match"]: false),
            test('Can read object field via datalink', () => dl.id != obj.id ? ["Fields don't match"] : false)
        );

        dl.id = newValue;
        results.push(
            test('Can write object field via datalink', () => dl.id != obj.id ? ["Fields don't match"] : false),
            test('Can trigger the handler on write access', () => {
                var error = false;
                expected.forEach( (v, i) => error = error || received[i] == v);
                return !error ? ['Handler receives bad arguments'] : false;
            })
        );

        var obj2 = {'num': 10, 'name': 'Test User2'};
        var dl2 = new Ui.DataLink(obj2);
        dl.link('id', dl2, 'num', x => x+1, x => x-1);
        
        results.push(
            test('Can link 2 objects', () => dl2.triggers['num'].find(x => x.obj == dl) != null ? ["Link does not exist"] : false),
            test('Can write linked fields', () => {
                var errors = [];
                dl.id = 3;
                if (dl2.num != dl.id + 1) errors.push('Destination field is not correct');
                dl2.num = 4;
                if (dl.id != dl2.num - 1) errors.push('Source field is not correct');
                return errors.length > 0 ? errors : false;
            })
        );

        return results;
    }

    function test_valueControls() {
        var results = ['Test ValueControls'];

        var data = {
            'id': 5,
            'name': 'Test User',
            'score': 12.8,
            'level': { 'min': 1, 'max': 5, 'value': 2 }
        };
        var data1 = {
            'id': 1,
            'name': 'User Test',
            'score': 12.1,
            'level': { 'min': 1, 'max': 5, 'value': 5 }
        };
        var data2 = {
            'id': 5,
            'name': 'Test User',
            'score': 12.8,
            'level': { 'min': 1, 'max': 5, 'value': 2 }
        };
        var dataLink = new Ui.DataLink(data);
        var levelLink = null;
        var controls = {
            'Label1': new Ui.Label('testLabel1', { 'data-field':'name', 'label':'Name' }),
            'Label2': new Ui.Label('testLabel2', { 'numeric':true, 'data-field':'id', 'label':true }),
            'Label3': new Ui.Label('testLabel3', { 'data-type':Ui.Control.DataTypes.Float, 'data-field':'score' }),
            'Label4': new Ui.Label('testLabel4', { 'numeric':true, 'data-field':'level' }),
            'Button': new Ui.Button('testButton'),
            'Textbox': new Ui.Textbox('testTextbox', { 'data-type':Ui.Control.DataTypes.Float, 'data-field':'score' })
        };
        for (var i in controls) {
            var control = controls[i];
            var testResults = ['<i>Testing ' + i + '</i>'];

            control.css.push('test');

            testResults.push(
                test('Can create control with default settings', () => {
                    control.setValue(i);
                    var errors = [];
                    if (control.id != 'test'+i) errors.push('Id is invalid');
                    //if (control.template.type != i) errors.push('Type is invalid');
                    var value = control.getValue();
                    if (!control.isNumeric && value != i || control.isNumeric && value != control.defaultValue) errors.push('Value is not correct');
                    return errors.length > 0 ? errors : false;
                }),
                test('Can bind control to data', () => {
                    if (control.dataField != 'level') {
                        control.dataBind(dataLink);
                    } else {
                        levelLink = control.dataBind(data.level, 'value');
                    }
                    var dataField = control.template['data-field'];
                    var value = dataField != 'level' ? dataLink[control.template['data-field']] : control.fromSource(levelLink['value']);
                    return control.dataLink && control.getValue() != value ? ['Data is not correctly bound'] : false;
                }),
                test('Can be changed by its bound data', () => {
                    var error = false;
                    if (control.dataLink) {
                        if (control.template['data-field'] != 'level') {
                            dataLink[control.dataField] = data1[control.dataField];
                            if (control.getValue() != data1[control.dataField]) error = ["Data write did not change control's value"];
                        } else {
                            levelLink.value = 3;
                            if (control.getValue() != control.fromSource(3)) error = ["Data write did not change control's value"];
                        }
                    }
                    return error;
                }),
                test('Can change its bound data', () => {
                    var error = false;
                    if (control.dataLink) {
                        if (control.template['data-field'] != 'level') {
                            control.setValue(data2[control.dataField]);
                            if (dataLink[control.dataField] != data2[control.dataField]) error = ["Change of control's value did not write data"];
                        } else {
                            control.setValue(75);
                            if (levelLink.value != control.toSource(75)) error = ["Change of control's value did not write data"];
                        }
                    }
                    return error;
                }),
                test('Can render control', () => {
                    control.render({element:document.body});
                    var errors = [];
                    var element = document.getElementById(control.id);
                    if (element == null) errors.push('Control not found in the DOM');
                    var value = element.value || element.innerHTML;
                    if (value != control.value) errors.push("Html element's value does not match control's value");
                    return errors.length > 0 ? errors : false;
                })
            );
            results.push(testResults);
        }
        return results;
    }

    function test_panel() {
        return [
            'Test boards',
            test('Creates a 2-level panel', () => {
                var panel = new Ui.Panel('TestPanel', {
                     layout:'horizontal',
                     css: 'main',
                     split: [20, 30, 50],
                     items: {
                         'left': { type: 'label', value: 'left' },
                         'middle': { type: 'label', value: 'middle' },
                         'right': {
                             type: 'panel',
                             css: 'right',
                             titlebar: false,
                             layout: 'vertical',
                             split: [30, 50, 20],
                             items: {
                                'top': { type: 'label', value: 'top' },
                                'middle': { type: 'label', value: 'middle' },
                                'bottom': { type: 'label', value: 'bottom' }
                             }
                        }
                     }
                });
                panel.onSplit = function(item) {
                    return new Ui.Label(item.id+'#1', {type:'label', value:'new'});
                }
                panel.render({element:document.body});
            })
        ];
    }

    var tests = async function() {
        return [
            //test_dataLink(),
            test_valueControls(),
            test_panel()
        ];
    };
    public(tests, 'Ui tests');
})();