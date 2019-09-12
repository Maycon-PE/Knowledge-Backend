const schedule = require('node-schedule')

module.exports = app => {
	schedule.scheduleJob('*/1 * * * *', async () => {
		const usersCount = await app.db('users').count('id').first()
		const categoriesCount = await app.db('categories').count('id').first()
		const articlesCount = await app.db('articles').count('id').first()

		const { Stat } = app.api.stats

		const lastStat = await Stat.findOne({}, {}, { sort: { 'createdAt': -1 } })

		const newStat = new Stat({
			users: usersCount['count(`id`)'],
			categories: categoriesCount['count(`id`)'],
			articles: articlesCount['count(`id`)'],
			createdAt: new Date()
		})

		const changeUsers = !lastStat || newStat.users !== lastStat.users
		const changeCategories = !lastStat || newStat.categories !== lastStat.categories
		const changeArticles = !lastStat || newStat.articles !== lastStat.articles

		if (changeUsers || changeCategories || changeArticles) {
			app.io.emit('new_stats')
			newStat.save().then(() => console.log('Estatísticas atualizadas!'))
		}
	})
}
