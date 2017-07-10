import { EventEmitter } from 'events'
import * as mqtt from 'mqtt'

import Router from './Router'

export interface IClientOptions extends mqtt.IClientOptions {}
export interface IConnackPacket extends mqtt.IConnackPacket {}
export interface IClientPublishOptions extends mqtt.IClientPublishOptions {}
export interface IClientSubscribeOptions extends mqtt.IClientSubscribeOptions {}
export interface ISubscriptionGrant extends mqtt.ISubscriptionGrant {}

export interface IPacket extends mqtt.IPacket {
  topic?: string
  params?: any
  payload?: Buffer
}

export class Client extends EventEmitter {
  private _opts: IClientOptions = null
  private _client: mqtt.Client = null
  private _routers: Router[] = []
  private _pendingPublishes: any[] = []
  private _pendingSubscriptions: any[] = []

  public constructor (opts?: IClientOptions) {
    super()
    this._opts = opts || {}
  }

  public get opts () {
    return this._opts
  }

  public get connected () {
    return this._client !== null && this._client.connected
  }

  public get reconnecting () {
    return this._client !== null && this._client.reconnecting
  }

  public use (router: Router) {
    if (!(router instanceof Router)) {
      throw new TypeError('must be an instance of Router')
    }
    this._routers.push(router)
  }

  public connect (url: string) {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        return reject(new Error('client already connected'))
      }

      const onConnect = (connack: IConnackPacket) => {
        removeListeners()
        this._attachEventHandlers()
        if (!connack.sessionPresent) {
          this._subsribePending()
          this._publishPending()
        }
        this.emit('connect', connack)
        resolve(connack)
      }

      const onError = (err: NodeJS.ErrnoException) => {
        removeListeners()
        reject(err)
      }

      const onClose = () => {
        removeListeners()
        reject(new Error('connection closed'))
      }

      const removeListeners = () => {
        this._client.removeListener('connect', onConnect)
        this._client.removeListener('error', onError)
        this._client.removeListener('close', onClose)
      }

      this._client = mqtt.connect(url, this._opts)
      this._client.on('connect', onConnect)
      this._client.on('error', onError)
      this._client.on('close', onClose)
    })
  }

  public publish (topic: string, message: string|Buffer|any, opts?: IClientPublishOptions) {
    return new Promise((resolve, reject) => {
      if (!topic || typeof topic !== 'string') {
        return reject(new TypeError('topic must be a string'))
      } else if (!message || (typeof message !== 'string' && !Buffer.isBuffer(message) && typeof message !== 'object')) {
        return reject(new TypeError('message must be a string, buffer or object'))
      } else if (opts && typeof opts !== 'object') {
        return reject(new TypeError('opts must be an object'))
      }

      opts = Object.assign({
        qos: 0,
        retain: false,
        dup: false
      }, opts || {})

      if (typeof message === 'object') {
        try {
          message = JSON.stringify(message)
        } catch (e) {}
      }

      if (this._client === null) {
        this._pendingPublishes.push([ topic, message, opts ])
        resolve()
      } else {
        this._client.publish(topic, message, opts, (err: Error) => {
          if (err) return reject(err)
          resolve()
        })
      }
    })
  }

  public subscribe (topic: string|string[], opts?: IClientSubscribeOptions) {
    return new Promise((resolve, reject) => {
      if (!topic || (typeof topic !== 'string' && !Array.isArray(topic))) {
        return reject(new TypeError('topic must be a string or array'))
      } else if (opts && typeof opts !== 'object') {
        return reject(new TypeError('opts must be an object'))
      }

      opts = Object.assign({ qos: 0 }, opts || {})
      if (this._client === null) {
        this._pendingSubscriptions.push([ topic, opts ])
        resolve()
      } else {
        this._client.subscribe(topic, opts, (err: Error, granted: ISubscriptionGrant[]) => {
          if (err) return reject(err)
          resolve(granted)
        })
      }
    })
  }

  public unsubscribe (topic: string|string[]) {
    return new Promise((resolve, reject) => {
      if (!topic || (typeof topic !== 'string' && !Array.isArray(topic))) {
        return reject(new TypeError('topic must be a string or array'))
      } else if (this._client === null) {
        return reject(new Error('client not available'))
      }

      this._client.unsubscribe(topic, (err: Error) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  public end (force = false) {
    return new Promise((resolve, reject) => {
      if (this._client === null) {
        return reject(new Error('client not available'))
      }

      this._client.end(force, () => {
        resolve()
      })
    })
  }

  private _attachEventHandlers () {
    const onConnect = (connack: IConnackPacket) => {
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

    const onError = (err: Error) => {
      this.emit('error', err)
    }

    const onMessage = (topic: string, message: string, packet: IPacket) => {
      this._handleMessage(packet)
    }

    const removeListeners = () => {
      this._client.removeListener('connect', onConnect)
      this._client.removeListener('close', onClose)
      this._client.removeListener('offline', onOffline)
      this._client.removeListener('message', onMessage)
      this._client.removeListener('error', onError)
    }

    this._client.on('connect', onConnect)
    this._client.on('close', onClose)
    this._client.on('offline', onOffline)
    this._client.on('message', onMessage)
    this._client.on('error', onError)
  }

  private _handleMessage (packet: IPacket) {
    for (let router of this._routers) {
      if(router.handle(packet)) return
    }

    this.emit('message', packet)
  }

  private _publishPending () {
    if (this._publishPending.length === 0) return

    let run = true
    const publishes = []
    while (run) {
      const [ topic, message, opts ] = this._pendingPublishes.pop()
      publishes.push(this.publish(topic, message, opts))
      run = this._pendingPublishes.length > 0
    }

    return Promise.all(publishes).then(() => {
      return true
    })
  }

  private _subsribePending () {
    if (this._pendingSubscriptions.length === 0) return

    let run = true
    const subscribtions = []
    while (run) {
      const [ topic, opts ] = this._pendingSubscriptions.pop()
      subscribtions.push(this.subscribe(topic, opts))
      run = this._pendingSubscriptions.length > 0
    }

    return Promise.all(subscribtions).then(() => {
      return true
    })
  }
}

export default Client
