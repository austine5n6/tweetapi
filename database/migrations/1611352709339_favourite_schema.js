'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FavouriteSchema extends Schema {
  up () {
    this.create('favourites', (table) => {
      table.increments()
      table.integer('user_id').unsigned().notNullable()
      table.integer('tweet_id').unsigned().notNullable()
      table.timestamps()
    }) 
  }

  down () {
    this.drop('favourites')
  }
}

module.exports = FavouriteSchema
