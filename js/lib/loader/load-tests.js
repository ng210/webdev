import { load } from '/lib/loader/load.js'
import { Test } from '/lib/test/test.js'

class LoadTest extends Test {
    async testLoadJsonSucceeds() {
        var data = await load({ url: './test-data/test.json', base:import.meta.url });
        this.isEqual('Should load json data', data, [
            {
                "id": 1,
                "name": "test.txt",
                "type": "text"
            },
            {
                "id": 2,
                "name": "test.json",
                "type": "json"
            },
            {
                "id": 3,
                "name": "test.png",
                "type": "image"
            }
        ]);
    }

    async testLoadTxtAsJsonFails() {
        var data = await load({
            url: './test-data/test.txt', base:import.meta.url,
            contentType: 'application/json'
        });
        this.isTrue('Should return error for wrong content type', data instanceof Error);
    }

    async testLoadFailsWith404() {
        var data = await load({
            url: './test-data/baka.json', base:import.meta.url
        });
        this.isTrue('Should return 404 error', data instanceof Error && data.message.indexOf('404') != -1);
    }
}

export { LoadTest };