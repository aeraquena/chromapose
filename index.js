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
    games: engine.games,
    pairs: engine.pairs
  });
}

// On new player connect
io.on('connection', function(socket){
  // set socket listeners

  console.log('connect, socket id: ' + socket.id);
  io.emit('userConnected');

  // On player disconnect
  socket.on('disconnect', function() {
    //io.emit('disconnectClient', socket.id);
    console.log('disconnect, socket id: ' + socket.id);
    // Find which game the player belonged to
    var gameId;
    var pairId;
    for (var gameIndex in engine.games) {
      for (var playerIndex in engine.games[gameIndex].players) {
        if (playerIndex == socket.id) {
          gameId = gameIndex;
          break;
        }
      }
    }

    if (gameId == null) {
      for (var pairIndex in engine.pairs) {
        for (var playerIndex in engine.pairs[pairIndex].players) {
          if (playerIndex == socket.id) {
            pairId = pairIndex;
            break;
          }
        }
      }
    }

    console.log('disconnect game id: ' + gameId);

    // Remove player from players in game.id
    if (gameId && engine.games[gameId]) {
  	 delete engine.games[gameId].players[socket.id]

    	// end game if there are no engine.players left
    	if (Object.keys(engine.games[gameId].players).length > 0) {
      	io.emit('gameStateUpdate', engine.games);
    	} else {
    		clearInterval(gameInterval)
        clearInterval(updateInterval)

        // Remove game
        delete engine.games[gameId];

        console.log('end game: ' + gameId);
    	}
    } else if (pairId && engine.pairs[pairId]) {
     delete engine.pairs[pairId].players[socket.id]

      // end game if there are no engine.players left
      // TODO: end game if anyone leaves?
      if (Object.keys(engine.pairs[pairId].players).length > 0) {
        io.emit('gameStateUpdate', engine.pairs);
      } else {
        clearInterval(gameInterval)
        clearInterval(updateInterval)

        // Remove game
        delete engine.pairs[pairId];

        console.log('end pair: ' + pairId);
      }
    }

    console.log('games:');
    console.log(engine.games);

    console.log('pairs:');
    console.log(engine.pairs);

    // Do the same for pairs
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
        }
      };

      console.log('Join, change target color');
      engine.changeTargetColor(gameId) // TODO: For this game
      updateInterval = setInterval(emitUpdates, 40) // necessary for each game?
    }

    // Assign player to game
    engine.games[gameId].players[socket.id] = {
      matching: false, // is player matching?
      y: 0,
      z: 0
    }

    console.log(engine.games);
  });

  // Player joins pair
  socket.on('joinPair', function(pairId) {
    console.log('join pair id: ' + pairId);

    var thisRole;

    // Create game if it doesn't exist
    if (!engine.pairs[pairId]) {
      // Create instance of game
      engine.pairs[pairId] = {
        players: {},
        targetPoint: {
          'v': 0, 
          'h': 0
        }
      };

      engine.changeTargetPoint(pairId)
      updateInterval = setInterval(emitUpdates, 40) // necessary for each game?

      // Assign this player role: 1
      thisRole = 1;
    } else {
      // Assign this player role: 2
      thisRole = 2;
    }

    // Assign player to game
    engine.pairs[pairId].players[socket.id] = {
      matching: false, // is player matching? //
      y: 0, // change to v
      z: 0, // change to h
      role: thisRole
    }

    console.log(engine.pairs);
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
        }
      };

      engine.changeTargetColor(gameId) // TODO: For this game
      updateInterval = setInterval(emitUpdates, 40) // necessary for each game?

      // Assign player to game
      engine.games[gameId].players[socket.id] = {
        matching: false, // is player matching?
        y: 0,
        z: 0
      }

      console.log(engine.games);
  });

  // On match
  socket.on('match', function(gameId){
    console.log('match, game id: ' + gameId);

    if (engine.games[gameId] && engine.games[gameId].players[socket.id]) {
      engine.games[gameId].players[socket.id].matching = true;
    }

    var allMatching = true;

    if (engine.games[gameId]) {
      // Update list of matching clients
      Object.keys(engine.games[gameId].players).forEach((playerId) => {
        // Check if all players are matching. If one is not, exit early
        if (engine.games[gameId].players[playerId].matching == false) {
          allMatching = false;
          return false;
        }
      })

      if (allMatching) {
        console.log('all matching - change target color');
        io.emit('colorChanged', gameId);
        engine.changeTargetColor(gameId);
      }
    }

    // Unmatch all players
    /*Object.keys(engine.games[gameId].players).forEach((playerId) => {
      engine.games[gameId].players[playerId].matching = false;
    })*/

    console.log(engine.games);
  });

  // On match
  socket.on('unmatch', function(gameId){
    console.log('Unmatch game id: ' + gameId);
    // Update list of matching clients
    // game id can be undefined
    if (engine.games[gameId]) {
      engine.games[gameId].players[socket.id].matching = false;
    }

    console.log(engine.games);
  });

  // On match
  socket.on('matchPair', function(pairId){
    console.log('match, game id: ' + pairId);

    if (engine.pairs[pairId] && engine.pairs[pairId].players[socket.id]) {
      engine.pairs[pairId].players[socket.id].matching = true;
    }

    var allMatching = true;

    if (engine.pairs[pairId]) {
      // Update list of matching clients
      Object.keys(engine.pairs[pairId].players).forEach((playerId) => {
        // Check if all players are matching. If one is not, exit early
        if (engine.pairs[pairId].players[playerId].matching == false) {
          allMatching = false;
          return false;
        }
      })

      if (allMatching) {
        console.log('all matching - change target color');
        io.emit('pointChanged', pairId);
        engine.changeTargetPoint(pairId);
      }
    }

    // Unmatch all players
    /*Object.keys(engine.games[gameId].players).forEach((playerId) => {
      engine.games[gameId].players[playerId].matching = false;
    })*/

    console.log(engine.games);
  });

  // On unmatch
  socket.on('unmatchPair', function(pairId){
    console.log('Unmatch game id: ' + pairId);
    // Update list of matching clients
    // game id can be undefined
    if (engine.pairs[pairId] && engine.pairs[pairId].players[socket.id]) {
      engine.pairs[pairId].players[socket.id].matching = false;
    }

    console.log(engine.pairs);
  });

  // Change target color manually
  socket.on('changeColor', function(gameId){
    engine.changeTargetColor(gameId);
    console.log('change target color manually');
    io.emit('colorChanged', gameId);
  });

  // Player moves
  // TODO: Remove from this and client code
  socket.on('move', function(position){
    //console.log('move');
    console.log(position);
    if (engine.pairs[position.gameId]) {
      engine.pairs[position.gameId].players[socket.id].y = position.y;
      engine.pairs[position.gameId].players[socket.id].z = position.z;
      
      console.log('matches game id');
      
      for (var playerIndex in engine.pairs[position.gameId].players) {
        console.log(playerIndex);
        console.log(engine.pairs[position.gameId].players[playerIndex]);
      }
      /*$.each(engine.pairs[position.gameId].players, function(k, v) {
        console.log(k);
        console.log(v);
      });*/
      //console.log(engine.games[position.gameId].players);

      /*io.emit('playerMoved', {
        'gameId': position.gameId, 
        'socketId': socket.id,
        'y': position.y,
        'z': position.z
      });*/
    }
  });
});

// Redirect all HTTP traffic to HTTPS
/*function ensureSecure(req, res, next){
  console.log('ensure secure');
  if(req.secure){
    console.log('secure');
    // OK, continue
    return next();
  };
  console.log('not secure');
  res.redirect('https://'+req.hostname+req.url); // handle port numbers if you need non defaults
};

app.all('*', ensureSecure);*/

var port = process.env.PORT || 8000;
http.listen(port, function(){
  console.log('listening on *:8000', process.env.PORT);
});