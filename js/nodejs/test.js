const { Console } = require('console');
const fs = require('fs');
require('nodejs.js');
include('./file-container.js');

function header(text) {
    console.log('\n* ' + text);
}
function footer() {
    console.log('')
}

function echo(text)
{
    console.log('  ' + text);
}


//#region TESTS
async function test_loading() {
    header('Test loading');
    echo('Should load test-file from current folder (app\'s path)');
    var res = await load('./test.txt');
    if (res.error) console.error(res.error);
    
    echo('Should load test-file from root folder');
    var res = await load('/nodejs/test.txt');
    if (res.error) console.error(res.error);

    echo('Should load test-file from relative path');
    res = await include('../nodejs/test.txt');
    if (res.error) console.error(res.error);
    footer('');
}

function test_base64() {
    header('Test Base64');
    var text = 'Hello World! This is a test text to be converted into base64.';
    res = btoa(text);
    echo('Should convert text to base64 => ' + res);
    if (typeof res !== 'string') console.error('Failed!');

    res = atob(res);
    echo('Should convert base64 back to test => ' + res);
    if (res != text) console.error('Failed!');
    echo('');
}

function test_container() {
    header('Test container');
    footer();
}
//#endregion

async function main(args, errors) {
    header('Test nodejs functions');
    await test_loading();
    test_base64();
    test_container();
}

run(main);