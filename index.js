var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var engine = require('./public/game')

var gameInterval, updateInterval

// ----------------------------------------
// Main server code
// ----------------------------------------

// serve css and js
app.use(express.static('public'))

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

function emitUpdates() {
  // tell everyone what's up
  io.emit('gameStateUpdate', { 
    players: engine.players, 
    targetColor: engine.targetColor,
    matchingPlayers: engine.matchingPlayers 
  });
}

// On new player connect
io.on('connection', function(socket){
  console.log('User connected: ', socket.id)
  // start game if this is the first player
  if (Object.keys(engine.players).length == 0) {
    engine.changeTargetColor()
    updateInterval = setInterval(emitUpdates, 40)
	}

  // add player to engine.players obj
  engine.players[socket.id] = {
    matching: false // the only one we'll keep
  }

  // set socket listeners

  // On player disconnect
  socket.on('disconnect', function() {
    // Remove player from players
  	delete engine.players[socket.id]
  	// end game if there are no engine.players left
  	if (Object.keys(engine.players).length > 0) {
    	io.emit('gameStateUpdate', engine.players);
  	} else {
  		clearInterval(gameInterval)
      clearInterval(updateInterval)
  	}
  })

  // On match
  socket.on('match', function(msg){

    engine.players[socket.id].matching = true;

    var allMatching = true;

    // Update list of matching clients
    Object.keys(engine.players).forEach((playerId) => {
      // Check if all players are matching. If one is not, exit early
      if (engine.players[playerId].matching == false) {
        allMatching = false;
        return false;
      }
    })

    if (allMatching) {
      io.emit('colorChanged');
      engine.changeTargetColor();
    }
  });

  // On match
  socket.on('unmatch', function(msg){
    // Update list of matching clients

    engine.players[socket.id].matching = false;
  });

  // Change target color manually
  socket.on('changeColor', function(msg){
    engine.changeTargetColor();
    io.emit('colorChanged');
  });

  // Kick all players off
  socket.on('disconnectAll', function(msg){
    engine.players = {};
    clearInterval(gameInterval)
    clearInterval(updateInterval)
  });
});

var port = process.env.PORT || 8000;
http.listen(port, function(){
  console.log('listening on *:8000', process.env.PORT);
});