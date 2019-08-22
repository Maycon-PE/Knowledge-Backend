module.exports = app => {
	const StatSchema = new app.mongo.Schema({
		users: Number,
		categories: Number,
		articles: Number,
		createdAt: Date
	})

	const Stat = app.mongo.model('Stat', StatSchema)

	const get = (req, res) => {
		Stat.findOne({}, {}, { sort: { 'createdAt': -1 } })
		.then(stats => {
			const defaultValue = {
				users: 0,
				categories: 0,
				articles: 0	
			}
			res.json(stats || defaultValue)
		})
		.catch(err => res.status(500).send(err))
	}

	return { Stat, get }
}	
