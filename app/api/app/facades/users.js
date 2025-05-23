// Reference models.
const User = require('#models/User');
// JWT facade.
const JWT = require('#facades/jwt.facade');
// Password hash and compare service.
const bcrypt = require('#services/bcrypt.service');
// Custom error.
const { Err } = require('#factories/errors');


module.exports = {
	// Auth:
	register: _register,
	login: _login,
	// Auth\

	// Private:
	getFullName: _getFullName

	// Add your methods here...

	// Private\
}

// Auth:
async function _register({ username, password }) { // Changed email to username
	try{
		// Try to create new user.
		const user = await User.create({
			username, // Changed email to username
			password
		});

		// Issue new access and refresh JWT.
		const [ tokens ] = await JWT.issueTokens({ user });

		// Prepare output.
		const result = [
			tokens,
			user
		];
		// Send output.
		return Promise.resolve(result);
	}
	catch(error){
		return Promise.reject(error);
	}
}

async function _login({ username, password }) { // Changed email to username
	try{
		// Try to find user.
		const user = await User.findOneByUsername(username); // Changed findOneByEmail to findOneByUsername

		if (!user) {
			// If no such user was found, throw error with name UserNotFound:
			const err = new Err('User not found');
			err.name = "UserNotFound";
			throw err;
		}

		if (!bcrypt.comparePasswords(password, user.password)) {
			// Validation failed,
			// throw custom error with name Unauthorized:
			const err = new Err(`Validation failed.`);
			err.name = "ValidationError";
			throw err;
		}

		// Issue new access and refresh JWT.
		const [ tokens ] = await JWT.issueTokens({ user });

		// Prepare output.
		const result = [
			tokens,
			user
		];
		// Send output.
		return Promise.resolve(result);
	}
	catch(error){
		return Promise.reject(error);
	}
}
// Auth\

// Private:
async function _getFullName({ userId }) {
    try {
        // Try to find user.
        const user = await User.findById(userId);

        if (!user) {
            // If no such user was found, throw error with name UserNotFound:
            const err = new Err('User not found');
            err.name = "UserNotFound";
            throw err;
        }

        // Вместо fullName возвращаем username
        const username = user.username;

        // Send output.
        return Promise.resolve([ username ]);
    }
    catch(error) {
        return Promise.reject(error);
    }
}
// Private\
