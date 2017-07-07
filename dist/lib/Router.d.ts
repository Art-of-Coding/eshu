/// <reference types="node" />
import { EventEmitter } from 'events';
import * as client from './Client';
export interface IRouterOptions {
    prefix?: string;
}
export interface IHandlerMethod {
    (packet: client.IPacket): void;
}
export declare class Router extends EventEmitter {
    private _client;
    private _patterns;
    private _opts;
    constructor(client: client.Client, opts?: IRouterOptions);
    readonly client: client.Client;
    readonly patterns: IterableIterator<string>;
    publish(topic: string, message: string | Buffer | any, opts?: client.IClientPublishOptions): Promise<{}>;
    subscribe(pattern: string | string[], fn: IHandlerMethod, opts?: client.IClientSubscribeOptions): Promise<client.ISubscriptionGrant>;
    unsubscribe(pattern: string | string[]): Promise<void>;
    private _prefix(topic);
    handle(packet: client.IPacket): boolean;
    private _attachEventHandlers();
}
export default Router;
