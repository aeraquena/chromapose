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
  // set socket listeners

  // On player disconnect
  socket.on('disconnect', function() {
    console.log('disconnect');
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
  	if (engine.games[gameId] && Object.keys(engine.games[gameId].players).length > 0) {
    	io.emit('gameStateUpdate', engine.games);
  	} else {
  		clearInterval(gameInterval)
      clearInterval(updateInterval)

      // Remove game
      delete engine.games[gameId];
  	}

    console.log(engine.games);
  })

  // Player joins game
  socket.on('join', function(gameId) {
    console.log('join game id: ' + gameId);

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

    console.log(engine.games);
  });

  // Player creates new game
  socket.on('newGame', function() {
    console.log('new game');

    // Generate game id
    var gameId = Math.floor(Math.random() * 1000);
    io.emit('gameCreated', {
      'gameId': gameId,
      'socketId': socket.id
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

      // Assign player to game
      engine.games[gameId].players[socket.id] = {
        matching: false // the only one we'll keep
      }

      console.log(engine.games);
  });

  // On match
  socket.on('match', function(gameId){
    console.log('match, game id: ' + gameId);

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
      console.log('emit color changed');
      io.emit('colorChanged', gameId);
      engine.changeTargetColor(gameId);
    }

    // Unmatch all players
    Object.keys(engine.games[gameId].players).forEach((playerId) => {
      engine.games[gameId].players[playerId].matching = false;
    })

    console.log(engine.games);
  });

  // On match
  socket.on('unmatch', function(gameId){
    console.log('Unmatch game id: ' + gameId);
    // Update list of matching clients
    // game id can be undefined
    engine.games[gameId].players[socket.id].matching = false;

    console.log(engine.games);
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