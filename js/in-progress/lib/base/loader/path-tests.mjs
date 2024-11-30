import { Path, CurrentDir } from './path.mjs'
import { Test } from '../../../../lib/test/test.mjs'

class PathTests extends Test {
    constructor(cons) {
        super(cons);
        this.cons.writeln(`Current directory: '${CurrentDir}'`);
    }

    async testBasename() {
        var data = [
            ['/foo/bar/baz/asdf/quux.html'],
            ['/foo/bar/baz/asdf/quux.html', '.html'],
            ['/foo/bar/baz/asdf/quux.html', 'html'],
            ['/foo/bar/baz/asdf/quux.html', '.ml'],
            ['/foo/bar/baz/asdf/quux.html////', '.html'],
            ['quux', '.html']
        ];
        var expected = [
            'quux.html',
            'quux',
            'quux.',
            'quux.html',
            'quux',
            'quux'
        ];
        return await this.assertMultiple(data, expected, Path.basename);
    }

    async testDirname() {
        var data = [
            '/foo/bar/baz/asdf/quux.html',
            '/foo/bar/baz/asdf///',
            '///foo/bar/baz/asdf',
            '/',
            '',
            ' '
        ];
        var expected = [
            '/foo/bar/baz/asdf',
            '/foo/bar/baz',
            '///foo/bar/baz',
            '/',
            '.',
            '.'
        ];
        return await this.assertMultiple(data, expected, Path.dirname);
    }

    async testExtname() {
        var data = [
            '///quux.html',
            '/foo/bar/baz/asdf/quux.html',
            '/foo/bar/baz/asdf/quux.html///',
            '/foo/bar/baz/asdf/quux.',
            '/.html'
        ];
        var expected = [
            '.html',
            '.html',
            '.html',
            '.',
            ''
        ];
        return await this.assertMultiple(data, expected, Path.extname);
    }

    async testFormat() {
        var data = [
            { dir: '/data\\misc', root: '/', base: 'test.txt', name: 'test', ext: 'txt' },
            { dir: '', root: '/', base: 'test.txt', name: 'test', ext: 'txt' },
            { dir: '', root: '/', base: '', name: 'test', ext: 'txt' },
            { dir: '', root: '/', base: '', name: 'test', ext: '.txt' },
            { dir: '', root: '/', base: '', name: 'test', ext: '' },
            { dir: '', root: '/data/', base: '', name: '/test', ext: '' },
            { dir: '', root: '/data', base: '', name: 'test', ext: '' }
        ];
        var expected = [
            `/data\\misc${Path.sep}test.txt`,
            `/test.txt`,
            `/test.txt`,
            `/test.txt`,
            `/test`,
            `/data//test`,
            `/datatest`
        ];
        return await this.assertMultiple(data, expected, Path.format);
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
        return await this.assertMultiple(data, expected, Path.join);
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
        return await this.assertMultiple(data, expected, Path.normalize);
    }

    async testParse() {
        var data = [
            '///data//a///',
            'data//a///',
            'data//a',
            '/data',
            '',
            ' ',
            '/',
            '/.',
            '/.a',
            '\\///\\a.html',
            'C:\\data\\a.html',
            'c:\\//data\\a.html',
            '/C:\\//data\\a.html',
            'c/:\\//data\\a.html',
            'c :a.html',
            'c: a.html',
            'c: /   a.html'
        ];
        var expected = [
            { root: '/', dir: '///data/', base: 'a', ext: '', name: 'a' },
            { root: '', dir: 'data/', base: 'a', ext: '', name: 'a' },
            { root: '', dir: 'data/', base: 'a', ext: '', name: 'a' },
            { root: '/', dir: '/', base: 'data', ext: '', name: 'data' },
            { root: '', dir: '', base: '', ext: '', name: '' },
            { root: '', dir: '', base: ' ', ext: '', name: ' ' },
            { root: '/', dir: '/', base: '', ext: '', name: '' },
            { root: '/', dir: '/', base: '.', ext: '', name: '.' },
            { root: '/', dir: '/', base: '.a', ext: '', name: '.a' },
            { root: '\\', dir: '\\///', base: 'a.html', ext: '.html', name: 'a' },
            { root: 'C:\\', dir: 'C:\\data', base: 'a.html', ext: '.html', name: 'a' },
            { root: 'c:\\', dir: 'c:\\//data', base: 'a.html', ext: '.html', name: 'a' },
            { root: '/', dir: '/C:\\//data', base: 'a.html', ext: '.html', name: 'a' },
            { root: '', dir: 'c/:\\//data', base: 'a.html', ext: '.html', name: 'a' },
            { root: '', dir: '', base: 'c :a.html', ext: '.html', name: 'c :a' },
            { root: 'c:', dir: 'c:', base: ' a.html', ext: '.html', name: ' a' },
            { root: 'c:', dir: 'c: ', base: '   a.html', ext: '.html', name: '   a' }
        ];
        return await this.assertMultiple(data, expected, Path.parse);
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
        return await this.assertMultiple(data, expected, Path.relative);
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
            //[ '/a/b', '../c', 'c:' ]
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
            //`c:${Path.sep}a${Path.sep}c`
        ];

        return await this.assertMultiple(data, expected, Path.resolve);
    }
}

export { PathTests };
