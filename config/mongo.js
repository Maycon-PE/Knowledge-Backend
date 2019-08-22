const mongoose = require('mongoose')

const { mongooseUrlConnection } = require('../.env')

mongoose.connect(mongooseUrlConnection, {
	useNewUrlParser: true
})
	.then(cn => console.log('\x1b[42m', 'Mongo conectado!', '\x1b[0m'))
	.catch(e => {
		const msg = 'Não foi possível conectar com o MongoDB!'
		console.log('\x1b[41m','\x1b[37m', msg, '\x1b[0m')
	})
