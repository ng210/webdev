window.Dbg = {
    con: null,
    prln: function (txt) {
        if (this.con == null) {
            this.con = document.getElementById('con');
        }
        con.innerHTML += txt + '<br/>';
    }
};

(function () {

    var ti_ = null;
    var GE = {
        frame: 0,
        start: function () {
            mainloop();
        },
        stop: function () {
            clearTimeout(ti_);
        },
        update: function (fm) { },
        render: function (fm) { }
    };

    function mainloop() {
        try {
            clearTimeout(ti_);
            GE.update(GE.frame);
            GE.render(GE.frame);
            GE.frame++;
            ti_ = setTimeout(mainloop, 500);
        } catch (e) {
            Dbg.prln(e.stack);
        }
    }
    module.exports = GE;
})();


