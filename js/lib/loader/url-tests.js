import { Url } from '../loader/url.js'
import Test from '../test/test.js'

class UrlTests extends Test {

    async testUrls() {
        var base = new Url(import.meta.url).origin;
        var sub = 'tmp';
        var data = [
            'test-file.json',
            './test-file.json',
            '../test-file.json',
            '/js/lib/base/test-file.json',
            'https://www.google.com/',
            'https://www.google.com/index.html',
            'https://www.google.com/search?q=javascript',
            'https://user:password@www.google.com:44/search?q=javascript#fragment'
        ];
        var expected = [
            `${base}/${sub}/test-file.json`,
            `${base}/${sub}/test-file.json`,
            `${base}/test-file.json`,
            `${base}/js/lib/base/test-file.json`,
            'https://www.google.com/',
            'https://www.google.com/index.html',
            'https://www.google.com/search?q=javascript',
            'https://user:password@www.google.com:44/search?q=javascript#fragment'
        ];

        await this.isEqual(
            'Should create valid URL objects',
            data.map(d => new Url(d, `${base}/${sub}/`).toString()),
            expected);
    }
}

export { UrlTests };
