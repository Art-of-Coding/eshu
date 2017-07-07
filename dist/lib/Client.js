"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const mqtt = require("mqtt");
const Router_1 = require("./Router");
class Client extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this._opts = null;
        this._client = null;
        this._routers = [];
        this._opts = opts || {};
    }
    get opts() {
        return this._opts;
    }
    get connected() {
        return this._client !== null && this._client.connected;
    }
    get reconnecting() {
        return this._client !== null && this._client.reconnecting;
    }
    use(router) {
        if (!(router instanceof Router_1.default)) {
            throw new TypeError('must be an instance of Router');
        }
        this._routers.push(router);
    }
    connect(url) {
        return new Promise((resolve, reject) => {
            if (this.connected) {
                return reject(new Error('client already connected'));
            }
            const onConnect = (connack) => {
                removeListeners();
                this._attachEventHandlers();
                this.emit('connect', connack);
                resolve(connack);
            };
            const onError = (err) => {
                removeListeners();
                reject(err);
            };
            const onClose = () => {
                removeListeners();
                reject(new Error('connection closed'));
            };
            const removeListeners = () => {
                this._client.removeListener('connect', onConnect);
                this._client.removeListener('error', onError);
                this._client.removeListener('close', onClose);
            };
            this._client = mqtt.connect(url, this._opts);
            this._client.on('connect', onConnect);
            this._client.on('error', onError);
            this._client.on('close', onClose);
        });
    }
    publish(topic, message, opts) {
        return new Promise((resolve, reject) => {
            if (!topic || typeof topic !== 'string') {
                return reject(new TypeError('topic must be a string'));
            }
            else if (!message || (typeof message !== 'string' && !Buffer.isBuffer(message) && typeof message !== 'object')) {
                return reject(new TypeError('message must be a string, buffer or object'));
            }
            else if (opts && typeof opts !== 'object') {
                return reject(new TypeError('opts must be an object'));
            }
            else if (this._client === null) {
                return reject(new Error('client not available'));
            }
            opts = Object.assign({
                qos: 0,
                retain: false,
                dup: false
            }, opts || {});
            if (typeof message === 'object') {
                try {
                    message = JSON.stringify(message);
                }
                catch (e) { }
            }
            this._client.publish(topic, message, opts, (err) => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
    subscribe(topic, opts) {
        return new Promise((resolve, reject) => {
            if (!topic || (typeof topic !== 'string' && !Array.isArray(topic))) {
                return reject(new TypeError('topic must be a string or array'));
            }
            else if (opts && typeof opts !== 'object') {
                return reject(new TypeError('opts must be an object'));
            }
            else if (this._client === null) {
                return reject(new Error('client not available'));
            }
            opts = Object.assign({ qos: 0 }, opts || {});
            this._client.subscribe(topic, opts, (err, granted) => {
                if (err)
                    return reject(err);
                resolve(granted);
            });
        });
    }
    unsubscribe(topic) {
        return new Promise((resolve, reject) => {
            if (!topic || (typeof topic !== 'string' && !Array.isArray(topic))) {
                return reject(new TypeError('topic must be a string or array'));
            }
            else if (this._client === null) {
                return reject(new Error('client not available'));
            }
            this._client.unsubscribe(topic, (err) => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
    }
    end(force = false) {
        return new Promise((resolve, reject) => {
            if (this._client === null) {
                return reject(new Error('client not available'));
            }
            this._client.end(force, () => {
                resolve();
            });
        });
    }
    _attachEventHandlers() {
        const onConnect = (connack) => {
            this.emit('connect', connack);
        };
        const onReconnect = () => {
            this.emit('reconnect');
        };
        const onClose = () => {
            this.emit('close');
        };
        const onOffline = () => {
            this.emit('offline');
        };
        const onError = (err) => {
            this.emit('error', err);
        };
        const onMessage = (topic, message, packet) => {
            this._handleMessage(packet);
        };
        const removeListeners = () => {
            this._client.removeListener('connect', onConnect);
            this._client.removeListener('close', onClose);
            this._client.removeListener('offline', onOffline);
            this._client.removeListener('error', onError);
            this._client.removeListener('message', onMessage);
        };
        this._client.on('connect', onConnect);
        this._client.on('close', onClose);
        this._client.on('offline', onOffline);
        this._client.on('error', onError);
        this._client.on('message', onMessage);
    }
    _handleMessage(packet) {
        for (let router of this._routers) {
            if (router.handle(packet))
                return;
        }
        this.emit('message', packet);
    }
}
exports.Client = Client;
exports.default = Client;
