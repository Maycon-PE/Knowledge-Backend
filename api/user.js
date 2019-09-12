const bcrypt = require('bcrypt-nodejs')

module.exports = app => {
	const { existsOrError, equalsOrError } = app.api.validation

	const encryptPassword = password => {
		const salt = bcrypt.genSaltSync(10)

		return bcrypt.hashSync(password, salt)
	}

	const save = async (req, res) => {
		const user = { ...req.body }
		if (req.params.id) user.id = req.params.id

		if (!req.originalUrl.startsWith('/users')) user.admin = false
		if (!req.user || !req.user.admin) user.admin = false

		try {
			const { name, email, password, confirmPassword } = user

			existsOrError(name, 'Nome não informado')
			existsOrError(email, 'Email não informado')
			existsOrError(password, 'Senha não informada')
			existsOrError(confirmPassword, 'Confirmação de senha inválida')
			equalsOrError(password, confirmPassword, 'Senhas não conferem')

			const userFromDB = await app.db('users')
				.where({ email: email })
				.first()


			!user.id && userFromDB && (() => {
				throw 'Usuário já cadastrado'
			})()
		} catch(msg) {
			return res.status(400).send(msg)
		}	

		if (req.method == 'POST') {
			user.password = encryptPassword(user.password)
		} else {
			if (!bcrypt.compareSync(user.password, req.user.password)) return res.status(401).send('Senha inválida!')
			delete user.password			
		}

		delete user.confirmPassword

		if (user.id) {
			app.db('users')
				.update(user)
				.where({ id: user.id })
				.then(() => {
					res.status(204).send()
				})
				.catch(err => {
					res.status(500).send(err)
				})
		} else {
			app.db('users')
				.insert(user)
				.then(() => {
					res.status(204).send()
				})
				.catch(err => {
					res.status(500).send(err)
				})
		}
	}

	const remove = (req, res) => {
		if (req.params.id) {
			if (req.params.id !== req.user.id) {
				try {
					app.db('articles')
						.where({ userId: req.params.id })
						.then(articles => {
							if (articles.length) {
								throw 'Usuário possúi artigos relacionados'
							} else {
								app.db('users')
								.select('admin')
								.where({ id: req.params.id })
								.then(async ([{ admin }]) => {
									if (!admin) {
										const rowsDeleted = await app.db('users')
											.where('id', req.params.id)
											.del()

										existsOrError(rowsDeleted, 'Usuário não deletado!')

										res.status(200).send()
									} else {
										res.status(403).send()
									}
								})
							}
						}).catch(e => {
							res.status(403).send(e)
						})
				} catch(e) {
					res.status(500).send(e)
				}
			} else {
				res.status(403).send()
			}
		} else {
			res.status(400).send()
		}
		
	}

	const limit = 3 //limite da paginação

	const get = async (req, res) => {
		if (req.query.all === '') {
			app.db('users')
			.select('id', 'name', 'email', 'admin')
			.then(users => res.json(users))
			.catch(err => res.status(500).send(err))
		} else {
			const page = +req.query.page || 1

			const result = await app.db('users')
				.count('id')
				.first()

			const count = Object.values(result)[0]

			app.db('users')
				.limit(limit)
				.offset(page * limit - limit)
				.then(users => {
					res.json({ data: users, count, limit })
				})
				.catch(err => res.status(500).send(err))
		}	
	}

	const getById = (req, res) => {
		const { id } = req.params
		app.db('users')
			.select('id', 'name', 'email', 'admin')
			.where({ id })
			.first()
			.then(user => res.json(user))
			.catch(err => res.status(500).send(err))
	}

	return { save, get, getById, remove }
}
