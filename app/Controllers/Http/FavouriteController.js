'use strict'

const Favourite = use('App/Models/Favourite')

class FavouriteController {

    async favourite({ request, auth, response }) {
        // get currently authenticated user
        const user = auth.current.user
        
        const tweetId = request.input('tweet_id')

        const favourite = await Favourite.findOrCreate(
            { user_id: user.id, tweet_id: tweetId },
            { user_id: user.id, tweet_id: tweetId },
        )
        return response.json({
            status: 'success',
            data: favourite
        })
    }
    
    async unFavourite ({params, auth, response }) {
        // get currently authenticated user
        const user = auth.current.user

        // fetch favourite
        const favourite = await Favourite.query()
        .where('user_id', user.id)
        .where('tweet_id', params.id)
        .delete()

            return response.json({
                status: 'success',
                data: null
            })
    }
}

module.exports = FavouriteController
