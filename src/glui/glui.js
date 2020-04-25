include('/glui/label.js');

(function() {

    function construct(node) {
        var typeName = node.tagName.charAt(0).toUpperCase() + node.tagName.substring(1).toLowerCase();
        var control = Reflect.construct(glui[typeName], []);
        control.construct(node);
        return control;
    }

    public(construct, 'construct', glui);
})();

