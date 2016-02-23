exports.post = function(req, res,next){
	var sid = req.session.id;
	var io = req.app.get("io");
	req.session.destroy(function(err){
		io.sockets._events.sessreload(sid);
		if(err) next(err);
		res.redirect('/');
	});
};