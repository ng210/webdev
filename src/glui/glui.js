include('/glui/label.js');

(function() {

    function fromNode(node) {
        var typeName = node.tagName.charAt(0).toUpperCase() + node.tagName.substring(1).toLowerCase();
        var control = Reflect.construct(glui[typeName], []);
        control.fromNode(node);
        return control;
    }

    public(construct, 'construct', glui);
})();

