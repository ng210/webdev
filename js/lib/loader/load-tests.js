import { load } from '/js/lib/loader/load.js'
import Test from '/js/lib/test/test.js'

class LoadTest extends Test {
    async testLoadJsonSucceeds() {
        var resp = await load({ url: './test-data/test.json', base:import.meta.url });
        this.isEqual('Should load json data', resp.content, [
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
        var resp = await load({
            url: './test-data/test.txt', base:import.meta.url,
            contentType: 'application/json'
        });
        this.isTrue('Should return error for wrong content type', resp.content instanceof Error);
    }

    async testLoadFailsWith404() {
        var resp = await load({
            url: './test-data/baka.json', base:import.meta.url
        });
        this.isTrue('Should return 404 error', resp.content instanceof Error && resp.content.message.indexOf('404') != -1);
    }
}

export { LoadTest };