var _ = require('lodash')
var mkKRLfn = require('../mkKRLfn')
var mkKRLaction = require('../mkKRLaction')
var Telnet = require('telnet-client')
var ping = require('ping')

var connection = new Telnet()
// default parameters
var parameters = {
  "host": '127.0.0.1',
  "port": 23,
  "shellPrompt": "QNET>",
  "loginPrompt": "login:",
  "passwordPrompt": "password:",
  "username": 'root',
  "password": 'guest',
  "failedLoginMatch": new RegExp('bad.*login.*'),
  "initialLFCR": true,
  "timeout": 1800000 // 30 minutes
}

var raiseEvent;
var meta_eci;

var isValidHost = async function() {
  let response = await ping.promise.probe(parameters.host);
  return response.alive;
}

connection.on('connect', function () {
  console.log('telnet connection established!')
})

connection.on('ready', function (prompt) {
  console.log('ready!')
  raiseEvent({
    eci: meta_eci,
    eid: "telnet_ready",
    domain: "telnet",
    type: "ready"
  })
})

connection.on('writedone', function () {
  console.log('writedone event!');
  raiseEvent({
    eci: meta_eci,
    eid: "telnet_writedone",
    domain: "telnet",
    type: "writedone"
  })
})

connection.on('failedlogin', function () {
  console.log('failedlogin event!')
  raiseEvent({
    eci: meta_eci,
    eid: "telnet_failedlogin",
    domain: "telnet",
    type: "failedlogin",
  })
})

connection.on('timeout', function () {
  console.log('socket timeout!')
  raiseEvent({
    eci: meta_eci,
    eid: "telnet_socket_timeout",
    domain: "telnet",
    type: "socket_timeout",
    attrs: { "duration": parameters.timeout }
  })
})

connection.on('error', function () {
  console.log('telnet error!');
  raiseEvent({
    eci: meta_eci,
    eid: "telnet_error",
    domain: "telnet",
    type: "error"
  })
})

connection.on('end', function () {
  console.log('telnet host ending connection!');
})

connection.on('close', function () {
  console.log('connection closed')
})

module.exports = function (core) {
  return {
    def: {
      'parameters': mkKRLfn([
      ], function (ctx, args) {
        return parameters;
      }),
      'host': mkKRLfn([
      ], function (ctx, args) {
        return parameters.host;
      }),
      'connect': mkKRLaction([
        'params'
      ], async function (ctx, args) {
        if (_.has(args, 'params')) {
          Object.keys(args.params).forEach(function(key) {
            parameters[key] = args.params[key]
          })
        }

        let alive = await isValidHost();
        console.log("alive", alive);

        if (alive) {
          meta_eci = _.get(ctx, ['event', 'eci'], _.get(ctx, ['query', 'eci']))
          raiseEvent = core.signalEvent;
          connection.connect(parameters);
          let res = await connection.send(
            parameters.username + '\r\n' + parameters.password + '\r\n'
          );
          return res;
        }
        return "Unable to connect to host " + parameters.host;
      }),
      'disconnect': mkKRLaction([
      ], async function (ctx, args) {
        let res = await connection.end();
        return res;
      }),
      'sendCMD': mkKRLaction([
        'command'
      ], async function (ctx, args) {
        if (!_.has(args, 'command')) {
          throw new Error('telnet:sendCMD needs a command string')
        }
        console.log('send cmd args', args)
        let res = await connection.send(args.command + '\r\n');
        return res;
      }),
      'query': mkKRLfn([
        'command'
      ], async function (ctx, args) {
        if (!_.has(args, 'command')) {
          throw new Error('telnet:query needs a command string')
        }
        console.log('send query args', args)
        let res = await connection.send(args.command + '\r\n');
        return res;
      })
    }
  }
}
