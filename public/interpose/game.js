var games = {}
var pairs = {}

// Update target color
function changeTargetPoint(pairId) {
  // Change target color
  pairs[pairId].targetPoint.phi = Math.floor(Math.random() * 180) + 180; // TODO: change this
  pairs[pairId].targetPoint.theta = Math.floor(Math.random() * 180) - 90; // or change this

  console.log('change target point');
  console.log(pairs[pairId].targetPoint);
}

// TODO: Remove this?
function changeTargetColor() {
  console.log('[C] changeTargetColor - remove this?');
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