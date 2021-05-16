(function() {

    const DPX_APP_KEY = 't6utp9tkf39xqyh';
    const DPX_TOKEN = 'sl.AwxSQDfENOutZ6S4eqxXR0WeiZLnTR2LmFDLgetiYgcPXJKc_-gh9FY8V60y2P4bfZvwND9br98b6iHl1C94hyLF-6GOfvy99z3RRdqvgRGVxbDTZtjUyWampuoO05fobRgPJT0';
    const DPX_PATH = '';

    function Dpx() {

    };

    extend(DataAccess, Dpx);

    Dpx.prototype.read = async function read(path) {

    };
    Dpx.prototype.write = async function write(path, content) {

    };
    Dpx.prototype.list = async function list(path) {

    };

    publish(Dpx, 'Dpx');
})();