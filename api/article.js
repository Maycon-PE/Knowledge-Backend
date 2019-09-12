const queries = require('./queries')

module.exports = app => {
	const { existsOrError } = app.api.validation

	const save = (req, res) => {
		const article = { ...req.body }
		if (req.params.id) article.id = req.params.id

		try {
			const { name, description, categoryId, userId, content } = article

			existsOrError(name, 'Nome não informado')
			existsOrError(description, 'Descrição não informada')
			existsOrError(categoryId, 'Categoria não informada')
			existsOrError(userId, 'Autor não informado')
			existsOrError(content, 'Conteudo não informado')
		} catch(msg) {
			return res.status(400).send(msg)
		}

		if (article.id) {
			app.db('articles')
				.update(article)
				.where({ id: article.id })
				.then(() => res.status(204).send())
				.catch(err => res.status(500).send())
		} else {
			app.db('articles')
				.insert(article)
				.then(() => res.status(204).send())
				.catch(err => res.status(500).send(err))
		}
	}

	const remove = async (req, res) => {
		try {
			existsOrError(req.params.id, 'Idêntificador do artico não informado')
			const rowDeleted = await app.db('articles')
				.where({ id: req.params.id })
				.del()	
			try {
				existsOrError(rowDeleted, 'Artigo não encontrado')
			} catch(msg) {
				return res.status(400).send(msg)
			}

			res.status(204).send()
		} catch(err) {
			res.status(500).send(err)
		}
	}

	const limit = 3 //Limite de paginação

	const index = async (req, res) => {
		const page = +req.query.page || 1

		const result = await app.db('articles')
			.count('id')
			.first()

		const count = Object.values(result)[0]
		
		app.db('articles')
			.limit(limit)
			.offset(page * limit - limit)
			.then(articles => {
				app.db('users')
					.select('id', 'name')
					.then(users => {
						app.db('categories')
							.select('id', 'name')
							.then(categories => {
								const newArticles = articles.map(article => {
									for (let u = 0; u < users.length; u++) {
										if (users[u].id === article.userId) {
											article.author = users[u].name
											break
										}
									}

									for (let c = 0; c < categories.length; c++) {
										if (categories[c].id === article.categoryId) {
											article.category = categories[c].name
											break
										}
									}
									return article
								})
								res.json({ data: newArticles, count, limit })
							}).catch(err => res.status(500).send())
					}).catch(err => res.status(500).send())
			})
			.catch(err => res.status(500).send())
	}

	const getById = (req, res) => {
		try {
			existsOrError(req.params.id, 'Idêntificador não informado')

			app.db('articles')
				.where({ id: req.params.id })
				.first()
				.then(article => {
					article.content = article.content.toString()
					res.json(article)
				})
				.catch(err => res.status(500).send(err))
		} catch(err) {
			res.status(500).send(err)
		}
	}

	const getByCategory = async (req, res) => {
		const categoryId = req.params.id
		const page = +req.query.page[0] || 1
		const [ categories ] = await app.db.raw(queries.categoryWithChildren, categoryId)
		const ids = categories.map(c => c.id)

		app.db({ a: 'articles', u: 'users' })
			.select('a.id', 'a.name', 'a.description', 'a.imageUrl', { author: 'u.name' })
			.limit(limit)
			.offset(page * limit - limit)
			.whereRaw('?? = ??', ['u.id', 'a.userId'])
			.whereIn('categoryId', ids)
			.orderBy('a.id', 'desc')
			.then(articles => res.json(articles))
			.catch(err => res.status(500).send(err))
	}

	return { save, remove, index, getById, getByCategory }
}
