export default class HttpError extends Error {
    _status;
    get status() {
        return this._status
    }
    _statusText;
    get statusText() {
        return this._statusText
    }
    _response;
    get response() {
        return this._response
    }

    constructor(resp = undefined) {
        super()
        if (resp) {
            this._response = resp
            this._status = resp.status
            this._statusText = resp.statusText
        }
    }
}