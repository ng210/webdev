import { Path, CurrentDir } from '../loader/path.js'
import Test from '../test/test.js'

class PathTests extends Test {
    #data = [
        ['\//foo/bar/baz/asdf/quux.', ''],
        ['/foo/bar/baz//quux.html', '.html'],
        ['/baz\\quux.html', 'html'],
        ['/quux.html', '.ml'],
        ['///.html////', '.html'],

        ['\///\.html////', '.html'],
        ['/..a', '.html'],
        [' ', ''],
        ['', ''],
        ['..', ''],

        ['...', ''],
        ['c: a.html', ''],
        ['c:\\a.html', ''],
        ['c :a.html', '']
    ];

    testBasename() {
        var expected = [
            'quux.',
            'quux',
            'quux.',
            'quux.html',
            '.html',

            '.html',
            '..a',
            ' ',
            '',
            '..',

            '...',
            ' a.html',
            'a.html',
            'c :a.html'
        ];
        return this.isEqual('Should return base name', this.#data.map(d => Path.basename(d[0])), expected);
    }

    testDirname() {
        var expected = [
            '//foo/bar/baz/asdf',
            '/foo/bar/baz/',
            '/baz',
            '/',
            '//',

            '//',
            '/',
            '.',
            '.',
            '.',

            '.'
        ];
        return this.isEqual('Should return dir name', this.#data.map(d => Path.dirname(d[0])), expected);
    }

    testExtname() {
        var expected = [
            '.',
            '.html',
            '.html',
            '.html',
            '',

            '',
            '.a',
            '',
            '',
            '',

            '.'
        ];
        return this.isEqual('Should return ext name', this.#data.map(d => Path.extname(d[0])), expected);
    }

    async testFormat() {
        var data = [
            { dir: '/foo/bar/baz', root: '/', base: 'quux.html', name: 'quux', ext: '.html' },
            { dir: '/foo/bar/baz/', root: '/', base: 'quux.html', name: 'quux', ext: 'html' },
            { dir: '/foo/bar/baz/', root: '/', base: 'quux', name: 'quux', ext: '.html' },
            { dir: '', root: 'c', base: '', name: 'quux', ext: '.html' },
            { dir: '', root: '/c/', base: '', name: '/quux', ext: '.html' },
        ];
        var expected = [
            `/foo/bar/baz${Path.sep}quux.html`,
            `/foo/bar/baz/${Path.sep}quux.html`,
            `/foo/bar/baz/${Path.sep}quux`,
            `cquux.html`,
            `/c//quux.html`
        ];
        return this.isEqual('Should return correct format', data.map(d => Path.format(d)), expected);
    }

    async testIsAbsolute() {
        var data = [
            Path.sep + "foo/bar",
            Path.sep + "foo/",
            Path.sep + "foo/..",
            "c:/foo/bar",
            "bar",
            "."
        ];
        var expected = [
            true,
            true,
            true,
            true,   // on windows
            false,
            false
        ];
        return this.isEqual('Should return isAbsolute', data.map(d => Path.isAbsolute(d)), expected);
    }

    async testJoin() {
        var data = [
            ['///data', '//a', '///'],
            ['data', '//a///'],
            ['data', 'a', '..'],
            ['/', 'data'],
            ['']
        ];
        var expected = [
            `${Path.sep}data${Path.sep}a${Path.sep}`,
            `data${Path.sep}a${Path.sep}`,
            'data',
            `${Path.sep}data`,
            '.'
        ];
        return this.isEqual('Should return joint path', data.map(d => Path.join(d)), expected);
    }

    async testNormalize() {
        var data = [
            '/data/misc/test.txt',
            '\\data\\misc\\.\\test.txt',
            '/data//misc/./test.txt',
            '//data//misc/./test.txt',
            '//////data//misc/./test.txt',
            '/data/../misc/../test.txt',
            '/data/misc',
            '/data/misc/'
        ];
        var expected = [
            `${Path.sep}data${Path.sep}misc${Path.sep}test.txt`,
            `${Path.sep}data${Path.sep}misc${Path.sep}test.txt`,
            `${Path.sep}data${Path.sep}misc${Path.sep}test.txt`,
            `${Path.sep}${typeof window === 'undefined' ? Path.sep : ''}data${Path.sep}misc${Path.sep}test.txt`,
            `${Path.sep}data${Path.sep}misc${Path.sep}test.txt`,
            `${Path.sep}test.txt`,
            `${Path.sep}data${Path.sep}misc`,
            `${Path.sep}data${Path.sep}misc${Path.sep}`
        ];
        return this.isEqual('Should return normalized path', data.map(d => Path.normalize(d)), expected);
    }

    async testParse() {
        var data = [
            'c:/a.html',
            'c:\\a.html',
            'c:\a.html',

            '/a.html',
            '//a.html',
            '///a.html',

            '\\a.html',
            '\a.html',

            'c:\\foo\\a.html',
            'c:\\foo/a.html',
            'c:/foo\\a.html',
            'c:/foo/a.html',

            '.html'
        ];
        var expected = [
            { root: 'c:/', dir: 'c:/', base: 'a.html', ext: '.html', name: 'a' },
            { root: 'c:\\', dir: 'c:\\', base: 'a.html', ext: '.html', name: 'a' },
            { root: 'c:', dir: 'c:', base: 'a.html', ext: '.html', name: 'a' },

            { root: '/', dir: '/', base: 'a.html', ext: '.html', name: 'a' },
            { root: '/', dir: '/', base: 'a.html', ext: '.html', name: 'a' },
            { root: '/', dir: '//', base: 'a.html', ext: '.html', name: 'a' },

            { root: '\\', dir: '\\', base: 'a.html', ext: '.html', name: 'a' },
            { root: '', dir: '', base: 'a.html', ext: '.html', name: 'a' },

            { root: 'c:\\', dir: 'c:\\foo', base: 'a.html', ext: '.html', name: 'a' },
            { root: 'c:\\', dir: 'c:\\foo', base: 'a.html', ext: '.html', name: 'a' },
            { root: 'c:/', dir: 'c:/foo', base: 'a.html', ext: '.html', name: 'a' },
            { root: 'c:/', dir: 'c:/foo', base: 'a.html', ext: '.html', name: 'a' },

            { root: '', dir: '', base: '.html', ext: '', name: '.html' }
        ];
        return this.isEqual('Should return parsed path', data.map(d => Path.parse(d)), expected);
    }

    async testRelative() {
        var data = [
            [ 'C:\\orandea\\test\\aaa', 'C:\\orandea\\impl\\bbb' ],
            [ 'C:\\aaa', 'C:\\orandea\\impl\\bbb' ],
            [ 'C:\\orandea\\test\\aaa', 'C:\\bbb' ],
            [ 'C:\\aaa', 'C:\\bbb' ],
            [ '', 'C:\\bbb' ],
            [ 'C:\\aaa', '' ]
        ];
        var expected = [
            `..${Path.sep}..${Path.sep}impl${Path.sep}bbb`,
            `..${Path.sep}orandea${Path.sep}impl${Path.sep}bbb`,
            `..${Path.sep}..${Path.sep}..${Path.sep}bbb`,
            `..${Path.sep}bbb`,
            `C:${Path.sep}bbb`,
            typeof self === 'undefined' ? process.cwd() : Path.sep
        ];
        return this.isEqual('Should return relative path', data.map(d => Path.relative(d[0], d[1])), expected);
    }

    async testResolve() {
        var data = [
            [ '', '', '' ],
            [ '/', '', '' ],
            [ '/', 'a', 'b' ],
            [ '/', '///', 'b' ],
            [ '/', ' ///', 'b' ],
            [ '/a/b' ],
            [ '/a/b', '../c' ],
            [ '/a/b', '../c', 'c:' ]
        ];

        var drive = Path.parse(CurrentDir).root;
        var expected = [
            CurrentDir,
            `${drive}`,
            `${drive}a${Path.sep}b`,
            `${drive}b`,
            `${drive} ${Path.sep}b`,
            `${drive}a${Path.sep}b`,
            `${drive}a${Path.sep}c`,
            `c:${Path.sep}a${Path.sep}c`
        ];
        
        return this.isEqual('Should return resolve path', data.map(d => Path.resolve(...d)), expected);
    }
}

export { PathTests };
