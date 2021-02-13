'use strict'

const User = use('App/Models/User')
const Hash = use('Hash')
const Tweet = use('App/Models/Tweet')

class UserController {
    async signup({ request, response, auth }) {
        //get user data from signup form
        const userData = request.only(['first_name', 'last_name', 'username', 'email', 'password'])

        try{
            //save user to database
            const user = await User.create(userData)
            //generate  JWT token for user
            const token = await auth.generate(user)

            return response.json({
                status: 'success',
                data: token
            })
        }catch(error) {
            return response.status(400).json({
                status: 'error',
                message: 'There was a problem creating the user, please try again!'
            })
        }
    }

    async login({ request, response, auth}) {
        try{
            //validate the user credentials and generate a JWT token
            const token = await auth.attempt(
                request.input('email'),
                request.input('password')
            )
            return response.json({
                status: 'success',
                data: token
            })
        }catch(error){
            response.status(400).json({
                status: 'error',
                message: 'Invalid email/password'
            })
        }
    }

    async me({ auth, response }) {
        const user = await User.query()
        .where('id', auth.current.user.id)
        .with('tweets', builder => {
            builder.with('user')
            builder.with('favourites')
            builder.with('replies')
        })
        .with('following')
        .with('followers')
        .with('favourites')
        .with('favourites.tweet', builder => {
            builder.with('user')
            builder.with('favourites')
            builder.with('replies')
        })
        .firstOrFail()

        return response.json({
            status: 'success',
            data: user
        })
    }

    async updateProfile({ request, auth, response }) {
        try{
              // get currently authenticated user
        const user = auth.current.user;

        //update the new data entered
        user.first_name = request.input('first_name')
        user.last_name = request.input('last_name')
        user.username = request.input('username')
        user.email = request.input('email')
        user.location = request.input('location')
        user.website_url = request.input('website_url')
        user.bio = request.input('bio')

        await user.save()
        return response.json({
            status: 'success',
            message: 'Profile updated!'
        })

        }catch (error){
            return response.status(400).json({
                status: 'error',
                message: 'There was a problem updating profile, please try again later'
            })
        }
    }

    async changePassword({request, auth, response}) {
        //get currently authenticated user
        const user = auth.current.user

        //verify if the current password matches
        const verifyPassword = await Hash.verify(
            request.input('password'),
            user.password
        )

        //display appropriate message if not the right password
        if(!verifyPassword) {
            return response.status(400).json({
                status: 'error',
                message: 'Current password does not match, Please try again!'
            })
        }
        // hash and save new password
        user.password = await Hash.make(request.input('newPassword'))
        await user.save()
        
        return response.json({
            status: 'success',
            message: 'Password updated successfully!'
        })
    }

    async showProfile({ request, params, response }) {
        try{
            const user = await User.query()
            .where('username', params.username)
            .with('tweets', builder => {
                builder.with('user')
                builder.with('favourites')
                builder.with('replies')
            })
            .with('following')
            .with('followers')
            .with('favourites')
            .with('favourites.tweet', builder => {
                builder.with('user')
                builder.with('favourites')
                builder.with('replies')
            })
            .firstOrFail()

            return response.json({
                status: 'success',
                data: user
            })
        }catch (error) {
            return response.status(404).json({
                status: 'error',
                message: 'User not found'
            })
        }
    }

    async usersToFollow ({ params, auth, response }) {
        // get currently authenticated user
        const user = auth.current.user

        //get the IDs of users the currently authenticated user is already following
        const usersAlreadyFollowing = await user.following().ids()

        //fetch users the currently authenticated user is not already following
        const usersToFollow = await User.query()
        .whereNot('id', user.id)
        .whereNotIn('id', usersAlreadyFollowing)
        .pick(3)

        return response.json({
            status: 'success',
            data: usersToFollow
        })
    }

    async follow ({request, auth, response }) {
        const user = auth.current.user
        
        //add to users followers
        await user.following().attach(request.input('user_id'))

        return response.json({
            status: 'success',
            data: null
        })
    }

    async unFollow({ params, auth, response }) {
        const user = auth.current.user

        //remove from user's followers
        await user.following().detach(params.id)

        return response.json({
            status: 'success',
            data: null
        })
    }

    async timeline ({auth, response }) {
        const user = await User.find(auth.current.user.id)

        //get an array of IDs of the user's followers
        const followersIds = await user.following().ids()

        //add the user's ID also to the array
        followersIds.push(user.id)

        const tweets = await Tweet.query()
        .whereIn('user_id', followersIds)
        .with('user')
        .with('favourites')
        .with('replies')
        .fetch()

        return response.json({
            status: 'success',
            data: tweets
        })
    }

    
}

module.exports = UserController