const fs = require('fs');
require('service/nodejs.js');

async function main(args, errors) {
    console.log('\n *** Test nodejs functions');

    console.log('Should load test-file from current folder (app\'s path)');
    var res = await load('./service-schema.json');
    if (res.error) console.error(res.error);
    
    console.log('Should load test-file from root folder (app\'s path)');
    var res = await load('/lib/service/service-schema.json');
    if (res.error) console.error(res.error);
    res = await include('/lib/utils/schema.js');
    if (res.error) console.error(res.error);

    console.log('Should load test-file from root folder (app\'s path)');
    res = await include('../utils/schema.js');
    if (res.error) console.error(res.error);

    var text = 'Hello World! This is a test text to be converted into base64.';
    res = btoa(text);
    console.log('Should convert text to base64 => ' + res);
    if (typeof res !== 'string') console.error('Failed!');

    res = atob(res);
    console.log('Should convert base64 back to test => ' + res);
    if (res != text) console.error('Failed!');
}

run(main);