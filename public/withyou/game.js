var games = {}
var pairs = {}

// Update target color
function changeTargetPoint(pairId) {
  // Change target color
  pairs[pairId].targetPoint.phi = Math.floor(Math.random() * 180) + 180;
  pairs[pairId].targetPoint.theta = Math.floor(Math.random() * 180) - 90;
}

function changeTargetColor() {
	
}

if (!this.navigator) { // determine whether this is a node module or inlined via script tag
  module.exports = {
    games: games,
    pairs: pairs,
    changeTargetColor: changeTargetColor,
    changeTargetPoint: changeTargetPoint
  }
}