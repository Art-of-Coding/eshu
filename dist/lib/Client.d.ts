/// <reference types="node" />
import { EventEmitter } from 'events';
import * as mqtt from 'mqtt';
import Router from './Router';
export interface IClientOptions extends mqtt.IClientOptions {
}
export interface IConnackPacket extends mqtt.IConnackPacket {
}
export interface IClientPublishOptions extends mqtt.IClientPublishOptions {
}
export interface IClientSubscribeOptions extends mqtt.IClientSubscribeOptions {
}
export interface ISubscriptionGrant extends mqtt.ISubscriptionGrant {
}
export interface IPacket extends mqtt.IPacket {
    topic?: string;
    params?: any;
    payload?: Buffer;
}
export declare class Client extends EventEmitter {
    private _opts;
    private _client;
    private _routers;
    constructor(opts?: IClientOptions);
    readonly opts: IClientOptions;
    readonly connected: boolean;
    readonly reconnecting: boolean;
    use(router: Router): void;
    connect(url: string): Promise<{}>;
    publish(topic: string, message: string | Buffer | any, opts?: IClientPublishOptions): Promise<{}>;
    subscribe(topic: string | string[], opts?: IClientSubscribeOptions): Promise<{}>;
    unsubscribe(topic: string | string[]): Promise<{}>;
    end(force?: boolean): Promise<{}>;
    private _attachEventHandlers();
    private _handleMessage(packet);
}
export default Client;
