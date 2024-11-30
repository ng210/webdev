include('/lib/utils/syntax.js');
include('grammar.js');

(function() {
    function ScriptEditor(id, template, parent, context) {
        ScriptEditor.base.constructor.call(this, id, template, parent, context);
    }
    extend(glui.Textbox, ScriptEditor);

    ScriptEditor.prototype.loadGrammar = async function loadGrammar(url) {
        
    };

    publish(ScriptEditor, 'ScriptEditor', glui);
})();