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
var PLAYER_LIST = {}; // List of players connected with Socket Id's.

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
	
	// Create a unique id for each connection
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	
	var player = Player(socket.id);
	PLAYER_LIST[socket.id] = player;
	
	// Listen when a client disconnect.
	socket.on('disconnect', function(){
		delete SOCKET_LIST[socket.id];
		delete PLAYER_LIST[socket.id];
	});
	
	// Retrieve the message emitted from the HTML 'happy'
	socket.on('happy',function(data){
		console.log('Client is happy' + data.reason);
	});
	
	// Send a message 'serverMsg' to the HTML with a msg data.
	socket.emit('serverMsg', {
		msg:'hello there',
	});
	
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
});
/*######################################
#  FUNCTION CALLED EVERY TIME (UPDATES)
#  Store all Connected Clients on a list
#  and Emit all positions to the Client
#  to draw each position. (LOOP)
########################################*/
setInterval(function(){
	var pack = []; //	List of all connected Clients
	
	// Updates all positions of the clients position
	// 1000/25 frames, then store them to our List.
	for(var i in PLAYER_LIST){
		var player = PLAYER_LIST[i];
		player.updatePosition();
		pack.push({
			x:player.x,
			y:player.y,
			number:player.number
			});
		
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
#  PLAYER CLASS
########################################
+	x position of the player
+	y position of the player
+	id unique for each player
+	number -> current Image of the player
-----------------------------------------
-	updatePosition:  handles the player 
-			pdates movement and maxspeed.
+---------------------------------------*/

var Player = function(id){
	var self = {
		x:250,
		y:250,
		id:id,
		number: Math.floor(10*Math.random()),
		pressingRight:false,
		pressingLeft:false,
		pressingUp:false,
		pressingDown:false,
		maxSpd:10,
	}
	
	self.updatePosition = function() {
		if(self.pressingRight)
			self.x += self.maxSpd;
		if(self.pressingLeft)
			self.x -= self.maxSpd;
		if(self.pressingUp)
			self.y -= self.maxSpd;
		if(self.pressingDown)
			self.y += self.maxSpd;
	}
	return self;
}







