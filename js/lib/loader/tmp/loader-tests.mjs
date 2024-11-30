import { IO } from './io.mjs'
import { Test } from '../../../test/test.mjs'
import { Url } from './url.mjs'
import { Path } from './path.mjs'

class LoaderTests extends Test {
    constructor(cons) {
        var config = {
            path: import.meta.url
        }
        super(cons, config);
    }

    async testGetJson() {
        var res = await IO.load('../res/test-file.json');
        await this.assert('Json is correct', res, { "name": "test-file", "ext": "json", "size": 123 });
    }

    async testGetDoc() {
        var res = await IO.load('test-doc.html', '../res');
        if (typeof window !== 'undefined') {
            this.cons.cons.appendChild(res);
        } else {
            this.cons.writeln(res);
        }

        await this.assert('Document fragment loaded', () => true);
    }

    async testGetImage() {
        var check = true;
        var url = '../res/avatar.png';
        var res = await IO.load({ 'url':url });
        if (typeof window !== 'undefined') {
            this.cons.cons.appendChild(res);
        } else {
            var fs = await import('node:fs');
            var stat = fs.lstatSync(Path.resolve(Url.Base.pathname.substring(1), url));
            var crc = 0;
            var view = new Uint8Array(res.buffer);
            for (var i in view) crc += view[i];
            this.cons.writeln(`name:${url}\nsize:${stat.size}\nCRC:${crc}`);
            check = view.length == stat.size;
        }

        await this.assert('Image loaded', () => check);
    }

    async testGetScript() {
        var mdl = await IO.load({ url:'../res/mdl.mjs'});
        var expected = 'Module loaded';
        // if (typeof window !== 'undefined') {
        //     document.head.appendChild(res);
        // } else {
        //     this.cons.writeln(res);
        // }
        var res = mdl.run();

        await this.assert('Script loaded', res, expected);
    }

    async testGetFromWeb() {
        var res = await IO.load({ url:'http://localhost:3000/js/lib/base/res/test-file.json', 'mode':'no-cors'});
        await this.assert('Json from web is correct', res, { "name": "test-file", "ext": "json", "size": 123 });
    }

    async testPost() {
        var message = { 'id': 1, 'text': 'This is a message!' };
        var res = await IO.load({ url:'http://localhost:3000/ping/', 'method':'post', 'body':message, 'contentType':'application/json'});
        await this.assert('Json from web is correct', res, message);
    }

    // async testGetScript() {
    //     var res = await IO.load({ url:'res/mdl3.mjs'});
    //     if (res instanceof Error) res = res.message;
    //     if (typeof window !== 'undefined') {
    //         this.cons.cons.appendChild(res);
    //     } else {
    //         this.cons.writeln(res);
    //     }
    //     return true;
    // }

//     dbg.prln('\nLoad a document');
//     res = await IO.load('test-doc.html', './res');
//     con.appendChild(res);

//     dbg.prln('\nLoad an image');
//     res = await IO.load('res/avatar.png');
//     con.appendChild(res);

//     dbg.prln('\nLoad a script');
//     res = await IO.load('res/mdl3.mjs');
//     if (res instanceof Error) dbg.prln(res.message);
//     else dbg.con.appendChild(res);
// }
}

export { LoaderTests };
