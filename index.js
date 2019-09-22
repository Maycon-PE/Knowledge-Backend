const app = require('express')()
const consign = require('consign')
const mysql = require('./config/db')
const mongoose = require('mongoose')

const server = require('http').createServer(app)

const io = require('socket.io')(server)

require('./config/mongo')

mysql.migrate.latest()

app.db = mysql
app.mongo = mongoose
app.io = io

consign()
	.include('./config/passport.js')
	.then('./config/middlewares.js')
	.then('./api/validation.js')
	.then('./api')
	.then('./schedule')
	.then('./config/routes.js')
	.into(app)

server.listen(8080, err => console.log(err? 'Error': 'Started'))
