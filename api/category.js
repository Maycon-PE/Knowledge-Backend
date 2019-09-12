module.exports = app => {
	const { existsOrError } = app.api.validation

	const save = (req, res) => {
		const category = { ...req.body }

		if (req.params.id) category.id = req.params.id

		try {
			existsOrError(category.name, 'Nome não informado')
		} catch(msg) {
			return res.status(400).send(msg)
		}

		if (category.id) {
			app.db('categories')
				.update(category)
				.where({ id: category.id })
				.then(() => {
					res.status(204).send()
				})
				.catch(err => {
					res.status(500).send(err)
				})
		} else {
			app.db('categories')
				.insert(category)
				.then(id => {
					app.io.emit('refresh-tree')
					res.status(204).send()
				})
				.catch(err => {
					res.status(500).send(err)
				})
		}
	}

	const remove = async (req, res) => {
		try {
			existsOrError(req.params.id, 'Código da categoria não foi informada')
			
			const subCategories = await app.db('categories')
				.where({ parentId: req.params.id })

			!!subCategories.length && (() => {
				throw 'Categoria possui sub-categorias'
			})()

			const articles = await app.db('articles')
				.where({ categoryId: req.params.id })

			!!articles.length	&& (() => {
				throw 'Categoria possui artigos'
			})()

			const rowsDeleted = await app.db('categories')
				.where({ id: req.params.id })
				.del()

			existsOrError(rowsDeleted, 'Categoria não foi encontrada')
			app.io.emit('refresh-tree')
			res.status(204).send()
		} catch(msg) {
			res.status(400).send(msg)
		}
	}

	const withPath = categories => {
		const getParent = (categories, parentId) => {
			const parent = categories.filter(parent => parent.id === parentId)

			return parent.length? parent[0] : null
		}

		const categoriesWithPath = categories.map(category => {
			let path = category.name
			let parent = getParent(categories, category.parentId)

			while (parent) {
				path = `${parent.name} > ${path}`
				parent = getParent(categories, parent.parentId)
			}

			return { ...category, path }
		})

		categoriesWithPath.sort((a, b) => {
			if (a.path < b.path) return -1
			if (a.path > b.path) return 1
			return 0
		})

		return categoriesWithPath
	}

	const limit = 3 //limite da paginação

	const get = async (req, res) => {
		if (req.query.all === '') {
			app.db('categories')
				.then(categories => {
					res.json(withPath(categories))
				}).catch(err => res.status(500).send(err))
		} else {
			const page = +req.query.page || 1

			const result = await app.db('categories')
				.count('id')
				.first()		

			const count = Object.values(result)[0]	

			app.db('categories')
				.limit(limit)
				.offset(page * limit - limit)
				.then(categories => {
					res.json({ data: withPath(categories), count, limit })
				})
				.catch(err => res.status(500).send(err))
		}
	}

	const getById = (req, res) => {
		app.db('categories')
			.where({ id: req.params.id })
			.first()
			.then(category => res.json(category))
			.catch(err => res.status(500).send(err))
	}

	const toTree = (categories, tree) => {
		if (!tree) tree = categories.filter(c => !c.parentId)

		tree = tree.map(parentNode => {
			const isChild = node => node.parentId === parentNode.id
			parentNode.nodes = toTree(categories, categories.filter(isChild))

			parentNode.key = `element_in_tree_key_${parentNode.id}`
			parentNode.label = parentNode.name

			return parentNode
		})

		return tree
	}

	const getTree = (req, res) => {
		app.db('categories')
			.then(categories => res.json(toTree(categories)))
			.catch(err => res.status(500).send())
	}

	return { save, get, getById, remove, getTree }
}