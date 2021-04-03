const fs = require('fs');
require('service/nodejs.js');

async function main(args, errors) {
    console.log('Should load test-file from current folder (app\'s path)');
    var res = await load('./service-schema.json');
    if (res.error) console.error(res.error);
    
    console.log('Should load test-file from root folder (app\'s path)');
    var res = await load('/lib/service/service-schema.json');
    if (res.error) console.error(res.error);


    res = await include('/lib/utils/schema.js');
    if (res.error) console.error(res.error);
    res = await include('../utils/schema.js');
    if (res.error) console.error(res.error);
}

run(main);