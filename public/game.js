var games = {
  /*'0': {
    players: {},
    targetColor: {
      'hue': 0, 
      'lightness': 0
    },
    matchingPlayers: 0
  }*/
}

// Update target color
function changeTargetColor(gameId) {
  // Needs to take in game id

  // Change target color
  games[gameId].targetColor.hue = Math.floor(Math.random() * 255);
  games[gameId].targetColor.lightness = Math.floor(Math.random() * 60) + 20; // 20-80% range
}

if (!this.navigator) { // determine whether this is a node module or inlined via script tag
  module.exports = {
    games: games,
    changeTargetColor: changeTargetColor
  }
}