#!/usr/bin/env node
var Router = require('./router')
var program = require('commander')
var startmistGeth = require('./services/startMistGeth')
var startFrontend = require('./services/startFrontend')
var fs = require('fs-extra')

program
.usage('-s <shared folder>')
.description('Provide a two ways connection between the local computer and Remix IDE')
.option('-s, --shared-folder <path>', 'Folder to share with Remix IDE')
.option('-m, --mist', 'start mist')
.option('-g, --geth', 'start geth')
.option('-p, --dev-path <dev-path>', 'Folder used by mist/geth to start the development instance')
.option('-f, --frontend <front-end>', 'Folder that should be served by remixd')
.option('-p, --frontend-port <front-end-port>', 'Http port used by the frontend (default 8082)')
.option('-a, --auto-mine', 'mine pending transactions')
.option('-r, --rpc <cors-domains>', 'start rpc server. Values are CORS domain')
.option('-rp, --rpc-port', 'rpc server port (default 8545)')
.parse(process.argv)
console.log('example: --dev-path /home/devchains/chain1 --mist --geth --frontend /home/frontend --frontend-port 8084 --auto-mine')
program.outputHelp()

var killCallBack = []

if (program.devPath) {
  if (fs.existsSync(program.devPath)) {
    killCallBack.push(startmistGeth(program.devPath, program.mist, program.geth, program.autoMine, program.rpc, program.rpcPort))
  } else {
    console.log('\x1b[31m%s\x1b[0m', '[ERR] can\'t start mist/geth. ' + program.devPath + ' does not exist')
  }
}

if (program.frontend) {
  if (!program.frontendPort) program.frontendPort = 8082
  if (fs.existsSync(program.frontend)) {
    killCallBack.push(startFrontend(program.frontend, program.frontendPort))
  } else {
    console.log('\x1b[31m%s\x1b[0m', '[ERR] can\'t start frontend. ' + program.frontend + ' does not exist')
  }
}

if (program.sharedFolder) {
  console.log('\x1b[33m%s\x1b[0m', '[WARN] Any application that runs on your computer can potentially read from and write to all files in the directory.')
  console.log('\x1b[33m%s\x1b[0m', '[WARN] Symbolinc links are not forwarded to Remix IDE\n')
  var router = new Router()
  killCallBack.push(router.start(program.sharedFolder))
}

// kill
function kill () {
  for (var k in killCallBack) {
    try {
      killCallBack[k]()
    } catch (e) {
      console.log(e)
    }
  }
}
process.on('SIGINT', kill) // catch ctrl-c
process.on('SIGTERM', kill) // catch kill
process.on('exit', kill)
