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
	
	// Retrieve the message emitted from the HTML 'happy'
	socket.on('happy',function(data){
		console.log('Client is happy' + data.reason);
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
	self.maxSpd = 10;
	
	// A reference to the Base Class update
	var super_update = self.update;
	self.update = function(){
		// Execute the Player updateSpd
		self.updateSpd();
		// Execute the base class update func
		super_update();
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
	return self;
}

/*######################################
#  BULLET CLASS <- ENTITY
#  Object that can be spawn anytime by
#  the player to 
########################################
+---------------------------------------*/
var Bullet = function(angle){
	var self = Entity();
	self.id = Math.random();
	// Direction of the bullet to project...
	self.spdX = Math.cos(angle/180*Math.PI) * 10;
	self.spdY = Math.sin(angle/180*Math.PI) * 10;
	self.timer = 0;
	// Bool to delete the bullet or not.
	self.toRemove = false;
	
	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > 100)
			self.toRemove = true;
		super_update();
	}
	Bullet.list[self.id] = self;
	return self;
}
Bullet.list = {}; // List of bullets in the game with unique id.

Bullet.update = function() {
	// Creates a bullet randomly depends...
	if(Math.random() < 0.1){
		Bullet(Math.random()*360);
	}
	var bulletPack = []; //	List of all bullets in the game
	for(var i in Bullet.list){
		var bullet = Bullet.list[i];
		bullet.update();
		bulletPack.push({
			x:bullet.x,
			y:bullet.y,
			});
	}
	return bulletPack // returns the bullet list back
}




