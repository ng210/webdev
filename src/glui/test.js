include('/glui/glui.js');
(function() {

    function test_construct() {
        var htmls = {
            "label": '<label id="label" value="label_value" />'
        };
        var element = document.createElement('div');

        for (var type in htmls) {
            if (htmls.hasOwnProperty(type)) {
                element.innerHTML = htmls[type];
                var control = glui.construct(element.getElementsByTagName(type)[0]);
                test(`Can construct ${type} from DOM`, () => {
                    var hasError = true;
                    if (control == null) {
                        error('Control is null');
                    } else if (control.id != type) {
                        error('Control.id invalid');
                    } else if (control.value != type+'_value') {
                        error('Control.value invalid');
                    } else {
                        hasError = false;
                    }
                    return hasError;
                });
            }
        }
    }

    function test_valueControls() {
        var types = [ "Label" ];

        var data1 = {
            "id": "id",
            "value": 0
        };
        var field1 = "id";

        for (var i=0; i<types.length; i++) {
            var type = types[i];
            var control = Reflect.construct(glui[type], [`ctrl${i}`, null, null]);
            test(`Can construct ${type} directly`, () => {
                try {
                    if (control == null) return 'Construct failed!';
                    message(`Control ${control.id} created`);
                } catch (err) {
                    return err.message;
                }
            });
            if (!control) return;
            test('Can bind data', () => {
                control.dataBind(data1, field1);
            });
        }
    }

    var tests = async function() {
        test_construct();
        test_valueControls();
    };
    public(tests, 'glUi tests');
})();