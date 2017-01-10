/**************************************
#  SERVER SOCKET
#  Handles all server-side calculation
#  and client-server relationship.
#--------------------------------------
#  Author: Richard Dean D.
****************************************/

/*######################################
#  SERVER INITIALIZATION
#  Contains instance of the app 
#  that holds an object Express Node.js
########################################*/

var express = require('express');
var app = express();
var serv = require('http').Server(app);
var SOCKET_LIST = {}; // List of conencted Clients with ID

/*######################################
#  SERVER CONNECTION LISTENING TO
#  PORT : 2000
########################################*/

app.get('/',function(req,res){
	res.sendFile(__dirname+'/client/index.html');
});
app.use('/client',express.static(__dirname+'/client'));
serv.listen(2000);
console.log('Server Started');

/*######################################
#  SOCKET/CLIENT CONNECTION LISTENING TO
#  PORT : 2000
#  Outputs If a client connected to our
#  server.
########################################
+ Socket: socket.on and Socket.emit(HTML)
+ Listening: socket.on(retrieves emitted)
+ Emiting: socket.emit(sends message to server)
+---------------------------------------*/
var io = require('socket.io')(serv,{});
var DEBUG = true; // if release turn this to FALSE
// Function that Listens
io.sockets.on('connection',function(socket){
	console.log('socket connection')
	
	// Connects player and store to our list
	Player.onConnect(socket);
	// Create a unique id for each connection
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	
	// Listen when a client disconnect.
	socket.on('disconnect', function(){
		delete SOCKET_LIST[socket.id];
		Player.onDisconnect(socket);
	});
	
	socket.on('sendMsgToServer', function(data){
		var playerName = ("" + socket.id).slice(2,7);
		for(var i in SOCKET_LIST)
			SOCKET_LIST[i].emit('addToChat', playerName + ':' + data);
	});
	// Retrieve the message emitted from the HTML 'happy'
	socket.on('happy',function(data){
		console.log('Client is happy' + data.reason);
	});
	
	socket.on('evalServer', function(data){
		if(!DEBUG)
			return;
		
		var res = eval(data);
		socket.emit('evalAnswer',res)
	});
	
	// Send a message 'serverMsg' to the HTML with a msg data.
	socket.emit('serverMsg', {
		msg:'hello there',
	});
	
});
/*######################################
#  FUNCTION CALLED EVERY TIME (UPDATES)
#  Store all Connected Clients on a list
#  and Emit all positions to the Client
#  to draw each position. (GLOBAL LOOP)
########################################*/
setInterval(function(){
	// Holds all the object list of each Entitiy
	// present in our game.
	var pack = {
		player:Player.update(),
		bullet:Bullet.update(),
	}
	// When we collected all updated positions
	// send each position as a message from the server
	// to the client to update the canvas
	for (var i in SOCKET_LIST){
		var socket = SOCKET_LIST[i]
		socket.emit('newPositions',pack)
	}
}, 1000/25);

/*######################################
#  PLAYER CLASS : ENTITY
########################################
-----------------------------------------
-	updatePosition:  handles the player 
-			pdates movement and maxspeed.
+---------------------------------------*/

var Player = function(id){
	var self = Entity();
	self.id = id,
	self.number = Math.floor(10*Math.random());
	self.pressingRight = false;
	self.pressingLeft = false;
	self.pressingUp = false;
	self.pressingDown = false;
	self.pressingAttack = false;
	self.mouseAngle = 0;
	self.maxSpd = 10;
	
	// A reference to the Base Class update
	var super_update = self.update;
	self.update = function(){
		// Execute the Player updateSpd
		self.updateSpd();
		// Execute the base class update func
		super_update();
		
		if(self.pressingAttack){
			self.shootBullet(self.mouseAngle);
		}
	}
	
	self.updateSpd = function() {
		if(self.pressingRight)
			self.spdX = self.maxSpd;
		else if(self.pressingLeft)
			self.spdX = -self.maxSpd;
		else
			self.spdX = 0;
		if(self.pressingDown)
			self.spdY = self.maxSpd;
		else if(self.pressingUp)
			self.spdY = -self.maxSpd;
		else
			self.spdY = 0;
	}
	
	// function lets the user shoot bullets.
	self.shootBullet = function(angle){
		var b = Bullet(self.id,angle);
		b.x = self.x;
		b.y = self.y;
	}
	// Add the newly created Player to a list
	Player.list[id] = self;
	return self;
}
// only one list~
Player.list = {}; // List of players.
// Function initialization just for Players, when
// it connects to the server. (MODULE)
Player.onConnect = function(socket){
	var player = Player(socket.id);

	// Socket Listening to keyPresses, emitted by Client.
	socket.on('keyPress',function(data){
		if(data.inputId === 'left')
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
		else if(data.inputId === 'mouseAngle')
			player.mouseAngle = data.state;
		else if(data.inputId === 'attack')
			player.pressingAttack = data.state;
	});
	
	// Socket Listening to onKeyUp, emitted by Client.
	socket.on('keyup',function(data){
		if(data.inputId === 'left')
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
	});
	
	// Socket listening to event mouse click
}
// This handles the removal of the player on disconnect.
Player.onDisconnect = function(socket){
	delete Player.list[socket.id];
}

Player.update = function(){
	var pack = []; //	List of all connected Clients
	// Updates all positions of the clients position
	// 1000/25 frames, then store them to our List.
	for(var i in Player.list){
		var player = Player.list[i];
		player.update();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number
			});
	}
	return pack // returns the player list back
}
/*######################################
#  ENTITY CLASS
########################################
+	x position of the Entity
+	y position of the Entity
+	id unique for each Entity
+	number -> current Image of the Entity
-----------------------------------------
-	updatePosition:  handles the Entity 
-			updates movement and maxspeed.
+---------------------------------------*/
var Entity = function() {
	var self = {
		x:250,
		y:250,
		spdX:0,
		spdY:0,
		id:"",
	}
	self.update = function(){
		self.updatePosition();
	}
	
	self.updatePosition = function() {
		self.x += self.spdX;
		self.y += self.spdY;
	}
	
	self.getDistance = function(pt) {
		return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
	}
	return self;
}

/*######################################
#  BULLET CLASS <- ENTITY
#  Object that can be spawn anytime by
#  the player to 
########################################
+---------------------------------------*/
var Bullet = function(parent,angle){
	var self = Entity();
	self.id = Math.random();
	// Direction of the bullet to project...
	self.spdX = Math.cos(angle/180*Math.PI) * 10;
	self.spdY = Math.sin(angle/180*Math.PI) * 10;
	self.timer = 0;
	// Bool to delete the bullet or not.
	self.toRemove = false;
	self.parent = parent;
	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > 100)
			self.toRemove = true;
		super_update();
		
		for(var i in Player.list){
			var p = Player.list[i];
			if(self.getDistance(p) < 32 && self.parent != p.id){
				// Collision is true, then remove HP --
				self.toRemove = true;
			}
		}
	}
	Bullet.list[self.id] = self;
	return self;
}
Bullet.list = {}; // List of bullets in the game with unique id.

Bullet.update = function() {
	var bulletPack = []; //	List of all bullets in the game
	for(var i in Bullet.list){
		var bullet = Bullet.list[i];
		bullet.update();
		if(bullet.toRemove)
			delete Bullet.list[i];
		
		bulletPack.push({
			x:bullet.x,
			y:bullet.y,
			});
	}
	return bulletPack // returns the bullet list back
}




