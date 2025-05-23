// Facades:
const usersFacade = require('#facades/users');
const jwtFacade = require('#facades/jwt.facade');
// JWT Service.
const JWT = require('#services/jwt.service');
// Reponse protocols.
const { 
	createOKResponse,
	createErrorResponse
} = require('#factories/responses/api');
// Custom error.
const { Err } = require('#factories/errors');
// JWT Config
const jwtConfig = require('#configs/jwt');


module.exports = UsersController;

function UsersController() {

	const _processError = (error, req, res) => {
		// Default error message.
		let errorMessage = error?.message ?? 'Internal server error';
		// Default HTTP status code.
		let statusCode = 500;

		switch(error.name) {
			case('Unauthorized'):
				errorMessage = 'Username or password are incorrect.';
				statusCode = 406;
				break;
			case('ValidationError'):
				errorMessage = "Invalid username OR password input";
				statusCode = 401;
				break;
			case('InvalidToken'):
				errorMessage = 'Invalid token or token expired';
				statusCode = 401;
				break;
			case('UserNotFound'):
				errorMessage = "Such user doesn't exist";
				statusCode = 400;
				break;

			// Perform your custom processing here...

			default:
				break;
		}

		// Send error response with provided status code.
		return createErrorResponse({
			res, 
			error: {
				message: errorMessage
			},
			status: statusCode
		});
	}

	// Auth:
	const _register = async (req, res) => {
		try {
			// Extract request input:
			const username = req.body?.username 
			const password = req.body?.password

			// Create new one.
			const [ tokens, user ] = await usersFacade.register({
				username, 
				password,
			});

			 // Set tokens in HttpOnly cookies
			res.cookie('accessToken', tokens.accessToken.token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
				sameSite: 'strict',
				maxAge: jwtConfig.accessToken.expiresIn, // in milliseconds
				path: '/'
			});
			res.cookie('refreshToken', tokens.refreshToken.token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
				sameSite: 'strict',
				maxAge: jwtConfig.refreshToken.expiresIn, // in milliseconds
				path: '/'
			});

			// Everything's fine, send response.
			return createOKResponse({
				res, 
				content:{
					// Convert user to JSON, to clear sensitive data (like password)
					user:user.toJSON()
				}
			});
		}
		catch(error) {
			console.error("UsersController._create error: ", error);
			return _processError(error, req, res);
		}
	}

	const _login = async (req, res) => {
		try {
			// Extract request input:
			const username = req.body?.username 
			const password = req.body?.password


			if (!username || username === undefined || !password || password === undefined) { 
				// If bad input, throw ValidationError:
				const err = new Error("Invalid username OR password input");
				err.name = "ValidationError";
				throw err;
			}

			const [ tokens, user ] = await usersFacade.login({ username, password }); 

			 // Set tokens in HttpOnly cookies
			res.cookie('accessToken', tokens.accessToken.token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: jwtConfig.accessToken.expiresIn,
				path: '/'
			});
			res.cookie('refreshToken', tokens.refreshToken.token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: jwtConfig.refreshToken.expiresIn,
				path: '/'
			});

			// Everything's fine, send response.
			return createOKResponse({
				res, 
				content:{
					// Convert user to JSON, to clear sensitive data (like password).
					user: user.toJSON()
				}
			});
		}
		catch(error){
			console.error("UsersController._login error: ", error);
			return _processError(error, req, res);
		}
	}

	const _validate = async (req, res) => {
		try {
			// const { token } = req.body; // No longer needed from body if using cookies for access
			const accessToken = req.cookies?.accessToken;

			if (!accessToken) {
				const err = new Error('Access Token not found in cookies!');
				err.name = "InvalidToken";
				throw err;
			}

			// Validate token against local seed.
			await JWT.verifyAccessToken(accessToken);

			// Everything's fine, send response.
			return createOKResponse({
				res,
				content:{
					isValid: true,
					message: "Valid Token"
				}
			});
		}
		catch(error) {
			console.error("UsersController._validate error: ", error);

			// In any error case, we send token not valid:
			// Create custom error with name InvalidToken.
			const err = new Error('Invalid Token!');
			err.name = "InvalidToken";
			return _processError(err, req, res);
		}
	}
	
	const _refresh = async (req, res) => {
		try {
			// Unwrap refresh token from cookie
			const clientRefreshToken = req.cookies?.refreshToken;

			if (!clientRefreshToken){ // Changed from req.refreshToken
				const err = new Err("No refreshToken found in cookies");
				err.name = "Unauthorized";
				err.status = 401;
				throw err;
			}

			// Verify the refresh token to get user id
			let parsedToken;
			try {
				[parsedToken] = await JWT.verifyRefreshToken(clientRefreshToken);
				if (!parsedToken || !parsedToken.id) {
					throw new Error("Invalid token structure");
				}
			} catch (verifyError) {
				console.error("Token verification failed:", verifyError);
				const err = new Err("Invalid or expired refresh token");
				err.name = "InvalidToken";
				err.status = 401;
				throw err;
			}
			
			// Create a proper refreshToken object with token property
			const refreshTokenObj = { ...parsedToken, token: clientRefreshToken };

			// Everything's ok, issue new one.
			// jwtFacade.refreshAccessToken expects an object with refreshToken property
			const [ newAccessToken ] = await jwtFacade.refreshAccessToken({ refreshToken: refreshTokenObj });

			res.cookie('accessToken', newAccessToken, { // newAccessToken is the token string itself
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: jwtConfig.accessToken.expiresIn,
				path: '/'
			});

			return createOKResponse({
				res,
				content:{
					message: "Access token refreshed successfully"
				}
			});
		}
		catch(error) {
			console.error("UsersController._refresh error: ", error);

			// In any error case, we send token not valid:
			// Create custom error with name InvalidToken.
			const err = new Error('Invalid Token!');
			err.name = "InvalidToken";
			return _processError(err, req, res);
		}
	}
	const _logout = async (req, res) => {
		try {
			// const refreshToken = req?.refreshToken; // No longer from req.refreshToken
			const clientRefreshToken = req.cookies?.refreshToken;

			if (!clientRefreshToken){
				const err = new Err("No refreshToken found in cookies");
				err.name = "Unauthorized";
				err.status = 401;
				throw err;
			}

			// Verify the refresh token to get user id
			const [parsedToken] = await JWT.verifyRefreshToken(clientRefreshToken);
			
			// Create a proper refreshToken object with token property
			const refreshTokenObj = { ...parsedToken, token: clientRefreshToken };

			// Everything's ok, destroy token.
			// jwtFacade.disableRefreshToken expects an object with refreshToken property
			const [ status ] = await jwtFacade.disableRefreshToken({ refreshToken: refreshTokenObj });

			// Clear cookies
			res.clearCookie('accessToken', { path: '/' });
			res.clearCookie('refreshToken', { path: '/' });

			return createOKResponse({
				res, 
				content:{
					status,
					loggedIn: false // status from disableRefreshToken might not directly mean loggedIn status
				}
			});
		}
		catch(error) {
			console.error("UsersController._logout error: ", error);
			
			// In any error case, we send token not valid:
			// Create custom error with name InvalidToken.
			const err = new Error('Invalid Token!');
			err.name = "InvalidToken";
			return _processError(err, req, res);
		}
	}
	// Auth\

	// Protected:
	const _getFullName = async (req, res) => {
		try {
			// Unwrap user's id.
			const userId = req?.token?.id;

			// Try to get full name.
			const [ fullName ] = await usersFacade.getFullName({ userId });

			console.log({ fullName });

			return createOKResponse({
				res, 
				content:{
					fullName
				}
			});
		}
		catch(error) {
			console.error("UsersController._getFullName error: ", error);
			return _processError(error, req, res);
		}
	}

	return {
		// Auth:
		register: _register,
		login: _login,
		validate: _validate,
		refresh: _refresh,
		logout: _logout,

		// Protected:
		getFullName:_getFullName
	}
}
