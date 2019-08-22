const { mysqlConnection } = require('./.env')

module.exports = {
  client: 'mysql2',
  connection: mysqlConnection,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }
}
