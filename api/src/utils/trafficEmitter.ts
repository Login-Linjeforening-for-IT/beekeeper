import { EventEmitter } from 'events'

class TrafficEmitter extends EventEmitter {}

const trafficEmitter = new TrafficEmitter()

export default trafficEmitter
