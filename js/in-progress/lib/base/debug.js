export var dbg = {
    print: function print(text) {
        var processed = text.replace('\n', '<br/>');
        con.innerHTML += processed;
    },
    
    println: function println(text) {
        this.print(text + '<br/>');
    },
    
    assert: function assert(check, label) {
        this.print(` - ${label}: `);
        if (check()) {
            this.println('<span style="color:#40ff60">passed</span>');
        } else {
            this.println('<span style="color:#ff6040">failed</span>');
        }
    }
    
};
