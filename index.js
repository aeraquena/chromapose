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
    games: engine.games
  });
}

// On new player connect
io.on('connection', function(socket){
  console.log('User connected: ', socket.id)
  // start game if this is the first player
  if (Object.keys(engine.games['0'].players).length == 0) {
    engine.changeTargetColor()
    updateInterval = setInterval(emitUpdates, 40)
	}

  // TODO: Remove this, do this on "join game" instead
  // add player to engine.players obj
  engine.games['0'].players[socket.id] = {
    matching: false // the only one we'll keep
  }

  // set socket listeners

  // On player disconnect
  socket.on('disconnect', function() {
    // Remove player from players
  	delete engine.games['0'].players[socket.id]
  	// end game if there are no engine.players left
  	if (Object.keys(engine.games['0'].players).length > 0) {
    	io.emit('gameStateUpdate', engine.games['0'].players);
  	} else {
  		clearInterval(gameInterval)
      clearInterval(updateInterval)
  	}
  })

  // On match
  socket.on('match', function(msg){

    engine.games['0'].players[socket.id].matching = true;

    var allMatching = true;

    // Update list of matching clients
    Object.keys(engine.games['0'].players).forEach((playerId) => {
      // Check if all players are matching. If one is not, exit early
      if (engine.games['0'].players[playerId].matching == false) {
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

    engine.games['0'].players[socket.id].matching = false;
  });

  // Change target color manually
  socket.on('changeColor', function(msg){
    engine.changeTargetColor();
    io.emit('colorChanged');
  });
});

var port = process.env.PORT || 8000;
http.listen(port, function(){
  console.log('listening on *:8000', process.env.PORT);
});