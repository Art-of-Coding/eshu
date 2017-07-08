import { EventEmitter } from 'events'

import * as client from './Client'
import * as Pattern from './Pattern'

export interface IRouterOptions {
  prefix?: string
}

export interface IHandlerMethod {
  (packet: client.IPacket): void
}

export class Router extends EventEmitter {
  private _client: client.Client = null
  private _patterns: Map<string, IHandlerMethod> = new Map()
  private _opts: IRouterOptions = {}

  public constructor (client: client.Client, opts?: IRouterOptions) {
    super()
    this._client = client
    this._opts = opts || {}

    this._attachEventHandlers()
    this._client.use(this)
  }

  public get client () {
    return this._client
  }

  public get patterns () {
    return this._patterns.keys()
  }

  public publish (topic: string, message: string|Buffer|any, opts?: client.IClientPublishOptions) {
    return this._client.publish(this._prefix(topic) as string, message, opts || {})
  }

  public subscribe (pattern: string|string[], fn: IHandlerMethod, opts?: client.IClientSubscribeOptions) {
    pattern = this._prefix(pattern)
    const topic = Pattern.clean(pattern)

    return this._client.subscribe(topic, opts || {}).then((granted: client.ISubscriptionGrant) => {
      if (typeof pattern === 'string') {
        this._patterns.set(pattern, fn)
      } else if (Array.isArray(pattern)) {
        for (let p of pattern) {
          this._patterns.set(p, fn)
        }
      }
      return granted
    })
  }

  public unsubscribe (pattern: string|string[]) {
    pattern = this._prefix(pattern)
    const topic = Pattern.clean(pattern)

    return this._client.unsubscribe(topic).then(() => {
      if (typeof pattern == 'string') {
        this._patterns.delete(pattern)
      } else if (Array.isArray(pattern)) {
        for (let p of pattern) {
          this._patterns.delete(p)
        }
      }
    })
  }

  private _prefix (topic: string|string[]) {
    if (this._opts.prefix && typeof topic === 'string') {
      return `${this._opts.prefix}/${topic}`
    } else if (this._opts.prefix && Array.isArray(topic)) {
      const all = []
      for (let value of topic) {
        all.push(`${this._opts.prefix}/${topic}`)
      }
      return all
    }
    return topic
  }

  public handle (packet: client.IPacket) {
    for (let [ pattern, handler ] of this._patterns) {
      if (Pattern.matches(pattern, packet.topic)) {
        packet.params = Pattern.extract(pattern, packet.topic)
        setImmediate(() => handler.bind(this)(packet))
        return true
      }
    }
    return false
  }

  private _attachEventHandlers () {
    const onConnect = (connack: client.IConnackPacket) => {
      this.emit('connect', connack)
    }

    const onReconnect = () => {
      this.emit('reconnect')
    }

    const onClose = () => {
      this.emit('close')
    }

    const onOffline = () => {
      this.emit('offline')
    }

    const removeListeners = () => {
      this._client.removeListener('connect', onConnect)
      this._client.removeListener('reconnect', onReconnect)
      this._client.removeListener('close', onClose)
      this._client.removeListener('offline', onOffline)
    }

    this._client.on('connect', onConnect)
    this._client.on('close', onClose)
    this._client.on('offline', onOffline)
    this._client.on('reconnect', onReconnect)
  }
}

export default Router
