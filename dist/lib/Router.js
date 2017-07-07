"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const Pattern = require("./Pattern");
class Router extends events_1.EventEmitter {
    constructor(client, opts) {
        super();
        this._client = null;
        this._patterns = new Map();
        this._opts = {};
        this._client = client;
        this._opts = opts || {};
        this._attachEventHandlers();
        this._client.use(this);
    }
    get client() {
        return this._client;
    }
    get patterns() {
        return this._patterns.keys();
    }
    publish(topic, message, opts) {
        return this._client.publish(this._prefix(topic), message, opts || {});
    }
    subscribe(pattern, fn, opts) {
        pattern = this._prefix(pattern);
        const topic = Pattern.clean(pattern);
        return this._client.subscribe(topic, opts || {}).then((granted) => {
            if (typeof pattern === 'string') {
                this._patterns.set(pattern, fn);
            }
            else if (Array.isArray(pattern)) {
                for (let p of pattern) {
                    this._patterns.set(p, fn);
                }
            }
            return granted;
        });
    }
    unsubscribe(pattern) {
        pattern = this._prefix(pattern);
        const topic = Pattern.clean(pattern);
        return this._client.unsubscribe(topic).then(() => {
            if (typeof pattern == 'string') {
                this._patterns.delete(pattern);
            }
            else if (Array.isArray(pattern)) {
                for (let p of pattern) {
                    this._patterns.delete(p);
                }
            }
        });
    }
    _prefix(topic) {
        if (this._opts.prefix && typeof topic === 'string') {
            return `${this._opts.prefix}/${topic}`;
        }
        else if (this._opts.prefix && Array.isArray(topic)) {
            const all = [];
            for (let value of topic) {
                all.push(`${this._opts.prefix}/${topic}`);
            }
            return all;
        }
        return topic;
    }
    handle(packet) {
        for (let [pattern, handler] of this._patterns) {
            if (Pattern.matches(pattern, packet.topic)) {
                packet.params = Pattern.extract(pattern, packet.topic);
                setImmediate(() => handler.bind(this)(packet));
                return true;
            }
        }
        return false;
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
        const removeListeners = () => {
            this._client.removeListener('connect', onConnect);
            this._client.removeListener('close', onClose);
            this._client.removeListener('offline', onOffline);
            this._client.removeListener('error', onError);
        };
        this._client.on('connect', onConnect);
        this._client.on('close', onClose);
        this._client.on('offline', onOffline);
        this._client.on('error', onError);
    }
}
exports.Router = Router;
exports.default = Router;
