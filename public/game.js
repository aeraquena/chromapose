var games = {}
var pairs = {}

// Update target color
function changeTargetColor(gameId) {
  // Needs to take in game id

  // Change target color
  games[gameId].targetColor.hue = Math.floor(Math.random() * 255);
  games[gameId].targetColor.lightness = Math.floor(Math.random() * 60) + 20; // 20-80% range
}

// Update target color
function changeTargetPoint(pairId) {
  // Change target color
  // change to scale of 0-100 to keep things easy
  // rename phi and theta
  pairs[pairId].targetPoint.v = Math.random();
  pairs[pairId].targetPoint.h = Math.random();

  console.log(pairs[pairId].targetPoint);
}

// determine whether this is a node module or inlined via script tag
if (!this.navigator) {
  module.exports = {
    games: games,
    pairs: pairs,
    changeTargetColor: changeTargetColor,
    changeTargetPoint: changeTargetPoint
  }
}