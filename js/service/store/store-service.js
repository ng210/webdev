require('service/nodejs.js');
include('/lib/service/store/store-api.js');

async function main(args, errors) {
    if (errors.length > 0) {
        for (var i=0; i<errors.length; i++) {
            console.log('Error: ' + errors[i].message);
        }
        return 0;
    }

    try {
        StoreApi.create('./store-service.json').then(x => {
            console.log(x.info());
            x.run()
        });
        
    } catch (err) {
        console.log(err);
    }
}

run(main);