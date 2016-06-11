var app = require('express')()
	  , server = require('http').createServer(app)
      , io = require('socket.io').listen(server)
      , fs = require('fs')
      , mysql = require('mysql');

app.configure(function(){
  app.use(require('connect').bodyParser());
  app.use(require('express').cookieParser());
  app.use(require('express').session({secret: '1234'}));
  app.use(require('express').static(__dirname + '/public'));
  app.use(app.router);
});
var client = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '*****',
});

server.listen(80);
client.connect();


    app.get('/', function (req, res) {
		res.sendfile(__dirname + '/views/index.html');
	});
	app.get('/register', function (req, res) {
		res.sendfile(__dirname + '/views/register.html');
	});
	app.get('/difficulty', function (req, res) {
		if (req.session.user)
			res.sendfile(__dirname + '/views/difficulty.html');
		else
			res.redirect('/');
	});
	app.get('/game', function (req, res) {
		if (req.session.user) {
			res.cookie('name', req.session.user);
			res.cookie('idplayer', req.session.userid);
			res.cookie('level', req.session.level);
			res.cookie('posx', req.session.posx);
			res.cookie('posy', req.session.posy);
			res.cookie('money', req.session.money);
			global.session = req.session;
			res.sendfile(__dirname + '/views/game.html');
		}
		else
			res.redirect('/');
	});
	app.post('/', function (req, res) {
            var TEST_DATABASE = 'js';
            var TEST_TABLE = 'players';
            client.query('USE '+TEST_DATABASE);
            client.query('SELECT name, idplayers, difficulty, posx, posy, level, money FROM '+TEST_TABLE+' WHERE email = "'+req.body.user+'" AND password = "'+req.body.pass+'"', function(err, results) {
              if (err) throw err;
			  if (results != 0) {
				req.session.user = req.body.user;
				req.session.userid = results[0].idplayers;
				req.session.level = results[0].level;
				req.session.posx = results[0].posx;
				req.session.posy = results[0].posy;
				req.session.money = results[0].money;
				if (results[0].difficulty)
				{
					req.session.diff = results[0].difficulty;
					res.redirect('/game');
				}
				else
					res.redirect('/difficulty');
			  }
			  else {
				res.redirect('/');
			  }
            });
		});
	app.post('/register', function (req, res) {
			client.query('USE js');
			var level = 1;
			var pos = 3;
			client.query('INSERT INTO `players` (`email`, `password`, `name`, `level`, `posx`, `posy`) VALUES ("'+req.body.user+'", "'+req.body.pass+'", "Player", "'+level+'", "'+pos+'", "'+pos+'")', function(err, results) {		
				if (err) throw err;
				if (results != 0)
					req.session.user = req.body.user;
				client.query('SELECT name, idplayers, posx, posy, level FROM `players` WHERE email = "'+req.body.user+'" AND password = "'+req.body.pass+'"', function(err, results) {
					 if (err) throw err;
					 if (results != 0) {
						req.session.user = req.body.user;
						req.session.userid = results[0].idplayers;
						req.session.level = results[0].level;
						req.session.posx = results[0].posx;
						req.session.posy = results[0].posy;
						console.log(results[0].idplayers);
						fs.writeFile('./public/maps/map'+req.session.userid+'.json', "{\"tileset\":\"crops_tileset_final.png\",\"map\":[[13,13,13,13,13,13,13,13,13,13],[13,13,13,13,13,13,13,13,13,13],[1,5,5,5,5,5,5,5,1,5],[7,11,9,9,10,9,9,9,7,7],[9,9,9,1,9,9,9,9,1,5],[9,9,9,9,9,9,11,9,1,5],[11,9,9,9,9,9,1,1,1,5],[9,11,11,9,9,9,1,1,1,5],[5,10,11,9,11,7,9,5,7,5],[5,9,10,11,11,11,11,11,5,5],[5,9,5,9,11,10,6,5,5,5],[5,5,5,5,5,5,5,5,5,5],[5,5,5,6,5,5,6,5,5,5],[5,5,5,5,5,5,5,5,5,5],[13,13,13,13,13,13,13,13,13,1],[13,13,13,13,13,13,13,13,13,2],[13,13,13,13,13,13,13,13,13,3],[13,13,13,13,13,13,13,13,13,4]]}", function(err) {
						if(err) {
							console.log(err);
						} else {
							console.log("The file was saved!");
						}});
					}
				});
			});
			res.redirect('/difficulty');
	});
	app.post('/difficulty', function (req, res) {
		var TEST_DATABASE = 'js';
		var TEST_TABLE = 'players';
		var money = 0;

		if (req.body.diff == 1)
			money = 100;
		else if (req.body.diff == 2)
			money = 50;
		else
			money = 10;
		client.query('USE '+TEST_DATABASE);
		client.query('UPDATE '+TEST_TABLE+' SET difficulty = "'+req.body.diff+'" WHERE idplayers = "'+req.session.userid+'"', function(err, results) {		
			if (err) throw err;
			if (results != 0)
				req.session.diff = req.body.diff;
		});
		client.query('UPDATE '+TEST_TABLE+' SET money = "'+money+'" WHERE idplayers = "'+req.session.userid+'"', function(err, resu) {
			if (err) throw err;
			if (resu != 0)
			{
				req.session.money = money;
				res.redirect('/game');
			}
		});
	});

var pos_grid = new Array();

function db_interaction(data, owe) {
	client.query('USE js');
	console.log(data);
	client.query('SELECT money FROM players WHERE idplayers = "'+data.id+'"', function(err, results) {
		if (err) throw err;
		var money = results[0].money - owe;
		client.query('UPDATE players SET money = "'+money+'" WHERE idplayers = "'+data.id+'"', function(err, resu) {
			if (err) throw err;
		});
	});
}

io.sockets.on('connection', function (socket) {
	
	socket.on('new_coord', function(data) {
/*		pos_grid[data.id] = new Array();
		pos_grid[data.id][0] = data.posx;
		pos_grid[data.id][1] = data.posy;
		console.log(pos_grid);
		socket.broadcast.emit('new_pos_grid', pos_grid);*/
	});

	socket.on('radis', function(farmer) {
		fs.readFile('./public/maps/map'+farmer.frame+'.json', 'utf8', function (err,data) {
			if (err)
				return console.log(err);
			data = JSON.parse(data);
			data.map[farmer.y][farmer.x] = 10;

			fs.writeFile('./public/maps/map'+farmer.frame+'.json', JSON.stringify(data), function(err) {
				if(err) console.log(err);
                else {
					console.log("The file was saved!");
					db_interaction(farmer, 4);
			}});
			socket.emit('plant_radis', data);
		});
		
	});
	
	socket.on('navet', function(farmer) {
		fs.readFile('./public/maps/map'+farmer.frame+'.json', 'utf8', function (err,data) {
			if (err)
				return console.log(err);
			data = JSON.parse(data);
			data.map[farmer.y][farmer.x] = 11;

			fs.writeFile('./public/maps/map'+farmer.frame+'.json', JSON.stringify(data), function(err) {
				if(err) {
					console.log(err);
				} else {
					console.log("The file was saved!");
					db_interaction(farmer, 6);
				}});
			socket.emit('plant_navet', data);
		});
	});
	
	socket.on('carotte', function(farmer) {
		fs.readFile('./public/maps/map'+farmer.frame+'.json', 'utf8', function (err,data) {
			if (err)
				return console.log(err);
			data = JSON.parse(data);
			data.map[farmer.y][farmer.x] = 9;

			fs.writeFile('./public/maps/map'+farmer.frame+'.json', JSON.stringify(data), function(err) {
				if(err) {
					console.log(err);
				} else {
					console.log("The file was saved!");
					db_interaction(farmer, 2);
				}});
			socket.emit('plant_carotte', data);
		});
	});

	socket.on('cold', function(farmer) {
		fs.readFile('./public/maps/map'+farmer.frame+'.json', 'utf8', function (err,data) {
			if (err)
				return console.log(err);
			data = JSON.parse(data);
			data.map[farmer.y][farmer.x] = 39;

			fs.writeFile('./public/maps/map'+farmer.frame+'.json', JSON.stringify(data), function(err) {
				if(err) {
					console.log(err);
				} else {
					console.log("The file was saved!");
					db_interaction(farmer, 50);
				}});
			socket.emit('plant_cold', data);
		});
	});

	socket.on('silo', function(farmer) {
        var self = this;
		fs.readFile('./public/maps/map'+farmer.frame+'.json', 'utf8', function (err,data) {
			if (err)
				return console.log(err);
			data = JSON.parse(data);
			data.map[farmer.y][farmer.x] = 38;

			fs.writeFile('./public/maps/map'+farmer.frame+'.json', JSON.stringify(data), function(err) {
				if(err) console.log(err);
                else {
					console.log("The file was saved!");
					db_interaction(farmer, 20);
                    var datat_modified = self.$parse(data);
                    socket.emit('plant_silo_extract', datat_modified);
				}});
			socket.emit('plant_silo', data);
		});
	});

	socket.on('barn', function(farmer) {
		fs.readFile('./public/maps/map'+farmer.frame+'.json', 'utf8', function (err,data) {
			if (err)
				return console.log(err);
			data = JSON.parse(data);
			data.map[farmer.y][farmer.x] = 37;

			fs.writeFile('./public/maps/map'+farmer.frame+'.json', JSON.stringify(data), function(err) {
				if(err) {
					console.log(err);
				} else {
					console.log("The file was saved!");
					db_interaction(farmer, 10);
				}});
			socket.emit('plant_barn', data);
		});
	});

	socket.on('harvest', function (farmer) {
		
	});
	socket.on('disconnect', function(){
		console.log('Server has disconnected');
	});

});
