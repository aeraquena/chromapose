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
  /*if (Object.keys(engine.games['0'].players).length == 0) {
    engine.changeTargetColor()
    updateInterval = setInterval(emitUpdates, 40)
	}*/

  // TODO: Remove this, do this on "join game" instead
  // add player to engine.players obj
  /*engine.games['0'].players[socket.id] = {
    matching: false // the only one we'll keep
  }*/

  // set socket listeners

  // On player disconnect
  socket.on('disconnect', function() {
    // Find which game the player belonged to
    var gameId;
    for (var gameIndex in engine.games) {
      for (var playerIndex in engine.games[gameIndex].players) {
        if (playerIndex == socket.id) {
          gameId = gameIndex;
          break;
        }
      }
    }
    console.log('disconnect game id: ' + gameId);

    // Remove player from players in game.id
    if (engine.games[gameId]) {
  	 delete engine.games[gameId].players[socket.id]
    }

  	// end game if there are no engine.players left
  	if (Object.keys(engine.games[gameId].players).length > 0) {
    	io.emit('gameStateUpdate', engine.games[gameId].players);
  	} else {
  		clearInterval(gameInterval)
      clearInterval(updateInterval)

      // Remove game
      delete engine.games[gameId];
  	}

    console.log('After disconnect');
    console.log(engine.games);
  })

  // Player joins game
  socket.on('join', function(gameId) {
    console.log('-- Start to join game --');
    // Create game if it doesn't exist
    // TODO: Remove this
    if (!engine.games[gameId]) {
      // Create instance of game
      engine.games[gameId] = {
        players: {},
        targetColor: {
          'hue': 0, 
          'lightness': 0
        },
        matchingPlayers: 0
      };

      engine.changeTargetColor(gameId) // TODO: For this game
      updateInterval = setInterval(emitUpdates, 40) // necessary for each game?
    }

    // Assign player to game
    engine.games[gameId].players[socket.id] = {
      matching: false // the only one we'll keep
    }

    console.log('-- Joined game --');
    console.log(engine.games);
  });

  // Player creates new game
  socket.on('newGame', function() {
    console.log('-- Create new game --');

    // Generate game id
    var gameId = Math.floor(Math.random() * 1000);
    io.emit('gameCreated', {
      'gameId': gameId/*,
      'socketId': socket.id*/
    });

    // Create instance of game
      engine.games[gameId] = {
        players: {},
        targetColor: {
          'hue': 0, 
          'lightness': 0
        },
        matchingPlayers: 0
      };

      engine.changeTargetColor(gameId) // TODO: For this game
      updateInterval = setInterval(emitUpdates, 40) // necessary for each game?

      console.log('Created game ' + gameId);
      console.log(engine.games);
  });

  // On match
  socket.on('match', function(gameId){
    console.log('Match, game id: ' + gameId);

    engine.games[gameId].players[socket.id].matching = true;

    var allMatching = true;

    // Update list of matching clients
    Object.keys(engine.games[gameId].players).forEach((playerId) => {
      // Check if all players are matching. If one is not, exit early
      if (engine.games[gameId].players[playerId].matching == false) {
        allMatching = false;
        return false;
      }
    })

    if (allMatching) {
      io.emit('colorChanged', gameId);
      engine.changeTargetColor(gameId);
    }
  });

  // On match
  socket.on('unmatch', function(gameId){
    // Update list of matching clients
    engine.games[gameId].players[socket.id].matching = false;
  });

  // Change target color manually
  socket.on('changeColor', function(gameId){
    engine.changeTargetColor(gameId);
    io.emit('colorChanged', gameId);
  });
});

var port = process.env.PORT || 8000;
http.listen(port, function(){
  console.log('listening on *:8000', process.env.PORT);
});