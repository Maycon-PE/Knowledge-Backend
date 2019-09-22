const schedule = require('node-schedule')

module.exports = app => {
	schedule.scheduleJob('*/1 * * * *', async () => {
		const usersCount = await app.db('users').count('id').first()
		const categoriesCount = await app.db('categories').count('id').first()
		const articlesCount = await app.db('articles').count('id').first()

		const { Stat } = app.api.stats

		const lastStat = await Stat.findOne({}, {}, { sort: { 'createdAt': -1 } })

		const data = {
			users: usersCount['count(`id`)'],
			categories: categoriesCount['count(`id`)'],
			articles: articlesCount['count(`id`)']
		}

		if (!lastStat) {
			const newStat = new Stat(data)

			newStat.save().then(() => console.log('Estatísticas atualizadas!'))
		} else {

			const changeUsers = !lastStat || data.users !== lastStat.users
			const changeCategories = !lastStat || data.categories !== lastStat.categories
			const changeArticles = !lastStat || data.articles !== lastStat.articles

			if (changeUsers || changeCategories || changeArticles) {

				const update = await Stat.updateOne({ _id: lastStat._id }, data)

				if (update.nModified) {
					app.io.emit('new_stats')
					console.log('Estatísticas atualizadas!')
				} else {
					console.log('Atualização falhou!')
				}
			}
		}
	})
}
