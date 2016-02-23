var mongoose = require('libs/mongoose');
var async = require('async');

async.series([
	open,
	dropDatabase,
	requireModels,
	createUsers
	],function(err){
		if(err) console.log(err);
		mongoose.disconnect();
		process.exit(err ? 255 : 0);
	});
function open (callback){
mongoose.connection.on('open',callback);
};

function dropDatabase(callback){
var db = mongoose.connection.db;
db.dropDatabase(callback);
};

function requireModels(callback){
	require ('models/user').User;
	async.each(Object.keys(mongoose.models), function(modelName,callback){
		mongoose.models[modelName].ensureIndexes(callback);
	},callback);
};


function createUsers(callback){

var users= [
{username:'Tom',password:"Tom"},
{username:'Jon',password:"Jon"},
{username:'admin',password:"admin"}
];

async.each(users,function(UserData,callback){
	var user = new mongoose.models.User(UserData);
	user.save(callback);
},callback);
};


