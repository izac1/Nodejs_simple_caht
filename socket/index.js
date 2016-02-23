var log = require('libs/log.js')(module);
var config = require('config');
var async = require('async');
var cookie = require('cookie');
var sessionStore = require('libs/sessionStore');
var HttpError = require('error').HttpError;
var User = require('models/user').User;
var cookieParser = require('cookie-parser');


function loadSession(sid,callback){
	sessionStore.load(sid,function(err,session){
		if (arguments.length==0){
			return callback(null,null);
		}else{
			return callback(null,session);
		}
	});
};

function loadUser(session,callback){
	if(!session.user){
		log.debug("Session %s is anonymous",session.id);
		return callback(null,null);
	}

	User.findById(session.user,function(err,user){

	log.debug("retievrng user",session.user);
	if(err) return callback(err);
	if(!user){
		return callback(null,null);
	}
	log.debug("user find result"+user);
	callback(null,user);

	});
	

};

module.exports = function(server){
var io = require('socket.io').listen(server,{logger:log});
io.set('origins','localhost:*');

io.use(function(socket,callback){
	async.waterfall([
		function(callback){
			socket.cookie = cookie.parse(socket.handshake.headers.cookie || '');
			var sidCookie = socket.cookie[config.get('session:key')];
			var sid = cookieParser.signedCookie(sidCookie,config.get('session:secret'));
			
			loadSession(sid,callback);
		},
		function(session,callback){

			if(!session){
				callback(new HttpError(401,"No session"));
			}
			socket.session = session;
			loadUser(session,callback);
		},

		function(user,callback){
			if(!user){
				callback(new HttpError(403,"No user"));
			}
			socket.user = user;
			callback(null);
		}

		],function(err){
			if(!err){
				return callback(null,true);
			}

			if(err instanceof HttpError){
				return callback(null,false);
			}
			callback(err);
		});
});


io.on("sessreload",function(sid){
	
	   for (var i in io.sockets.connected) {
        var s = io.sockets.connected[i];
       
		if(s.session.id != sid) return;
		loadSession(sid,function(err,session){
			if(err){
				//s.emit("error","server error");
				s.disconnect();
				return;
			}

			if(!session){
				s.emit("logout","handshake unauth");
				s.disconnect();
				return;
			}
			s.session = session;
		});
	};
});



io.on('connection' , function(socket){


	var username = socket.user.get('username');
	socket.broadcast.emit('join',username);

	socket.on('message',function(text,cb){
		socket.broadcast.emit('message',username,text);
		cb && cb();
	});

	socket.on('disconnect',function(){
		socket.broadcast.emit('leave',username);
	});
});
return io;
};