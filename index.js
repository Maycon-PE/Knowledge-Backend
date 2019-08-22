const app = require('express')()
const consign = require('consign')
const mysql = require('./config/db')
const mongoose = require('mongoose')

require('./config/mongo')

app.db = mysql
app.mongo = mongoose

consign()
	.include('./config/passport.js')
	.then('./config/middlewares.js')
	.then('./api/validation.js')
	.then('./api')
	.then('./schedule')
	.then('./config/routes.js')
	.into(app)

app.listen(3001, err => console.log(err? 'Error': 'Started'))
