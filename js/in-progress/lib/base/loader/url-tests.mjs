import { Url } from './url.mjs'
import { Test } from '../../../../lib/test/test.mjs'

class UrlTests extends Test {
    constructor(cons) {
        super(cons);
        Url.setDocumentRoot('/code/git/webdev');
        var url = new Url();
        this.cons.writeln('Url base: ' + url);
    }

    async testUrls() {
        var data = [
            'test-file.json',
            './test-file.json',
            '../test-file.json',
            '/js/lib/base/test-file.json',
            'https://www.google.com/',
            'https://www.google.com/index.html',
            // 'https://www.google.com/search?q=javascript',
            // 'https://user:password@www.google.com:44/search?q=javascript#fragment',

        ];
        var url = import.meta.url.split('/').reduce((acc, part, pi, arr) => pi < arr.length - 2 ? acc + '/' + part : acc);
        var urlBase = new Url(url + '/');
        this.cons.writeln(`Relative to '${urlBase}'`);
        var expected = [
            `${urlBase.protocol}//${urlBase.hostname}${urlBase.port ? ':' + urlBase.port : ''}${urlBase.pathname}loader/test-file.json`,
            `${urlBase.protocol}//${urlBase.hostname}${urlBase.port ? ':' + urlBase.port : ''}${urlBase.pathname}loader/test-file.json`,
            `${urlBase.protocol}//${urlBase.hostname}${urlBase.port ? ':' + urlBase.port : ''}${urlBase.pathname}test-file.json`,
            `${urlBase.protocol}//${urlBase.hostname}${urlBase.port ? ':' + urlBase.port : ''}${urlBase.pathname}test-file.json`,
            'https://www.google.com/',
            'https://www.google.com/index.html',
            // 'https://www.google.com/search?q=javascript',
            // 'https://user:password@www.google.com:44/search?q=javascript#fragment'
        ];

        await this.assertMultiple(data, expected, d => new Url(d, urlBase+'loader/').toString());
        // for (var di=0; di<data.length; di++) {
        //     var url = new Url(data[di], urlBase);
        //     var received = url.toString();
        //     if (!this.assert(`${data[di]}\n${expected[di]}\n${received}`, () => expected[di].localeCompare(received) == 0)) errors++;
        // }
    }
}

export { UrlTests };
