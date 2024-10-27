var games = {}
var pairs = {}

// Chromapose: Update target color
function changeTargetColor(gameId) {
  console.log('[C] changeTargetColor');
  // Needs to take in game id

  // Change target color
  games[gameId].targetColor.hue = Math.floor(Math.random() * 255);
  games[gameId].targetColor.lightness = Math.floor(Math.random() * 60) + 20; // 20-80% range
}

// Interpose: Update target point
// TODO: This is being used - is /interpose/game.js being used?
function changeTargetPoint(pairId) {
  console.log('[C] changeTargetPoint');
  // Change target color
  // change to scale of 0-100 to keep things easy
  // rename phi and theta
  pairs[pairId].targetPoint.v = Math.random(); // TODO: Here! between 0 and 1. clamp to .2 and .8?
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