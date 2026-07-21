const express = require('express')
const path = require('path')
const opn = require('opn')

const server = express()
const host = 'http://localhost:6900'
server.use('/assets', express.static(path.resolve(__dirname, './assets')))
server.use('/dist', express.static(path.resolve(__dirname, './dist')))

server.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, './index.html'));
})

server.listen(6900, () => {
  console.log(`server started at ${host}`)
})
