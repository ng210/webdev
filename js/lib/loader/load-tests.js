import { load, HttpError } from './load.js'
import Test from '../test/test.js'

class LoadTest extends Test {
    async testLoadJsonSucceeds() {
        const resp = await load({ url: './test-data/test.json', base:import.meta.url });
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
        const err = await load({
            url: './test-data/test.txt', base:import.meta.url,
            contentType: 'application/json'
        });
        this.isTrue('Should return error for wrong content type', err instanceof SyntaxError);
    }

    async testLoadFailsWith404() {
        const err = await load({
            url: './test-data/baka.json', base:import.meta.url
        });
        this.isTrue('Should return 404 error', err instanceof HttpError && err.status == 404);
    }
}

export { LoadTest };