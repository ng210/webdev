(function(){
    var testUrls = [
        './base/test.js',
        './data/test.js',
        './glui/test.js',
        './math/test.js',
        './player/test.js',
        './synth/test.js',
        './utils/test.js',
        './webgl/test.js',
        './webgl/sprite/test.js'
    ];

    var success = 0;
    async function test_lib() {
        TestConfig.isNonInteractive = true;
        for (var i=0; i<testUrls.length; i++) {
            var testUrl = new Url(testUrls[i], self.appUrl);
            await test(`${i+1}/${testUrls.length}. Run test ${testUrl.getPath()}`, async function(ctx) {
                TestConfig.isSilent = true;
                var isSuccessful = await run_test(testUrl);
                TestConfig.isSilent = false;
                if (isSuccessful) success++;
                ctx.assert(isSuccessful, 'true');
            });
            Dbg.prln('');
        }
        message(`\nOverall results: ${Math.floor(success/testUrls.length*100).toFixed(2)}%\n`);
    }

    var tests = () => [
        test_lib
    ];

    publish(tests, 'LibTests');
})();