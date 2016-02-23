var HttpError = require('error').HttpError;

module.exports = function(req,res,next){

	if(!req.session.user){
		return next(new HttpError(401,"Need Enter"));
	}
	next();
};