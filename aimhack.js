
var printPos = (pId) => console.log('player ' + pId, players[pId].x, players[pId].y, players[pId].z);

var MEID = meId.toString();


const MAP_SIZE_PX = 200;
const mapCanvas = document.createElement("CANVAS");
mapCanvas.height = MAP_SIZE_PX;
mapCanvas.width = MAP_SIZE_PX;
mapCanvas.style.border = "1px solid #000000";
mapCanvas.style.position = "absolute";
mapCanvas.style.left = "0";
mapCanvas.style.top = "0";
document.body.appendChild(mapCanvas);
const mapCanvasContext = mapCanvas.getContext("2d");

var drawItem = (pos, markSize = 4) => {
  markSize += pos.y * 2;
  mapCanvasContext.beginPath();
  mapCanvasContext.arc(pos.x, pos.z, markSize, 0, 2*Math.PI);
  mapCanvasContext.stroke();
};

var drawDot = (pos, markSize = 8, dirSize = 15) => {
  markSize += pos.y * 2;
	const offset = markSize / 2;
	mapCanvasContext.fillStyle = pos.id == MEID
    ? "#00FFFF"
    : targetId == pos.id
      ? "#FFFFFF"
      : (pos.hp > 0 ? "#88BB00" : "#882222");
  mapCanvasContext.fillRect(pos.x - offset, pos.z - offset, markSize, markSize);

  mapCanvasContext.lineWidth = 3;
  mapCanvasContext.beginPath();
	mapCanvasContext.moveTo(pos.x, pos.z);
	mapCanvasContext.lineTo(
    pos.x + dirSize * Math.sin(pos.viewYaw),
    pos.z + dirSize * Math.cos(pos.viewYaw)
  );
	mapCanvasContext.stroke();
};

const GAME_TO_MAP_RATIO = MAP_SIZE_PX / 26;
const convertMapCoords = player => Object.assign({}, player, {x: player.x * GAME_TO_MAP_RATIO, z: player.z * GAME_TO_MAP_RATIO});

const drawPlayer = player => drawDot(convertMapCoords(player));

setInterval(() => {
	mapCanvasContext.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    for(p in players) {
    	drawPlayer(players[p]);
    }

    itemManager.pools[0].objects.filter(x => x.active).map(x => x.mesh.position).map(x => drawItem(convertMapCoords(x)));
} , 500);



/////////////////////////////////

var fixAngle = angle => {
  if (angle < 0) angle += Math.PI * 2;
  if (angle < 0) angle += Math.PI * 2;
  if (angle < 0) angle += Math.PI * 2;
  if (angle - Math.PI * 2 > 0) angle -= Math.PI * 2;
  if (angle - Math.PI * 2 > 0) angle -= Math.PI * 2;
  if (angle - Math.PI * 2 > 0) angle -= Math.PI * 2;
  return angle;
};

var dst = (p1, p2) => Math.sqrt((p1.x - p2.x)*(p1.x - p2.x) + (p1.y - p2.y)*(p1.y - p2.y) + (p1.z - p2.z)*(p1.z - p2.z));
var nearest = () => {
  var minDist=9999;
  var nearestId = -1;
  for(p in players) {
    if(p != MEID && players[p].hp > 0 && minDist > dst(me, players[p])) {
      nearestId = p;
      minDist = dst(me, players[p]);
    }
  }
  return {
    id: nearestId,
    dist: minDist
  };
};

var deltaP = (p1id, p2id) => ({
  dx: players[p1id].x - players[p2id].x,
  dy: players[p1id].y - players[p2id].y,
  dz: players[p1id].z - players[p2id].z
});

var calcAim = (againstId, showDebug) => {
  var d = deltaP(MEID, againstId);
  showDebug && console.log('normalized', d);
  return {
    pitch: Math.atan2(d.dy, Math.sqrt(d.dx*d.dx + d.dz*d.dz)),
    yaw: fixAngle(-Math.PI/2.0 - Math.atan2(d.dz, d.dx))
  };
};
var applyAim = (againstId, showDebug) => {
  var aim = calcAim(againstId);
  me.pitch = aim.pitch;
  me.viewYaw = me.moveYaw = aim.yaw;
  showDebug && console.log(aim);
};

var isOn = false;
var targetId = null;
setInterval(() => {
  if (targetId && (players[targetId].hp == 0 || me.hp == 0)) targetId = null;
  targetId && applyAim(targetId);
}, 100 )

const angleDiff = (a1, a2) => Math.min(Math.abs(a1 - a2 - 4*Math.PI), Math.abs(a1 - a2 - 2*Math.PI), Math.abs(a1 - a2), Math.abs(a1 - a2 + 2*Math.PI), Math.abs(a1 - a2 + 4*Math.PI));
const getNearestAim = () => {
  var minDiff = 1000000;
  var minId = null;
  for(p in players) {
    if (p != MEID && players[p].hp > 0) {
      const aim = calcAim(p);
      const aimMiss = angleDiff(aim.yaw, me.viewYaw);
      if (aimMiss < minDiff) {
        minDiff = aimMiss;
        minId = p;
      }
    }
  }
  return minId;
};
document.addEventListener("mousedown", (e) => {
  if(e.button == 2) {
    targetId = !!targetId ? null : getNearestAim();
  }
});

/////////////////////////////////////////////////////////////////

//
// var drawBox = (coords, markSize = 8) => {
//   const canvasContext = canvas.getContext("experimental-webgl");
//   const offset = markSize / 2;
//   canvasContext.fillStyle = "#FF0000";
//   canvasContext.fillRect(coords.x - offset, coords.y - offset, markSize, markSize);
// };


// const boxCanvas = document.createElement("CANVAS");
// boxCanvas.height = canvas.height;
// boxCanvas.width = canvas.width;
// boxCanvas.style.border = "1px solid #000000";
// boxCanvas.style.position = "absolute";
// boxCanvas.style.left = "0";
// boxCanvas.style.top = "0";
// document.body.appendChild(boxCanvas);
// const boxCanvasContext = boxCanvas.getContext("2d");
//
// var drawBox = (coords, markSize = 40) => {
//   boxCanvasContext.beginPath();
//   boxCanvasContext.arc(coords.x, coords.y, markSize, 0, 2*Math.PI);
//   boxCanvasContext.stroke();
// };


var outputplane = BABYLON.Mesh.CreatePlane("outputplane", 25, scene, false);
outputplane.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
outputplane.material = new BABYLON.StandardMaterial("outputplane", scene);
outputplane.material.backFaceCulling = false;
outputplane.scaling = {x: 0.02, y: 0.02, z: 1}; // magic
outputplane.position = new BABYLON.Vector3(0, 0, 0.2);
outputplane.parent = camera;
var outputplaneTexture = new BABYLON.DynamicTexture("dynamic texture", 512, scene, true);
outputplaneTexture.hasAlpha = true;
outputplane.material.diffuseTexture = outputplaneTexture;

var placeDot = (coords, text = '*') => outputplaneTexture.drawText(text, coords.x, coords.y, "20px verdana", "white");

var getCoordsOf = (mesh) => BABYLON.Vector3.Project(
  mesh.position,
  BABYLON.Matrix.Identity(),
  camera.getViewMatrix().multiply(camera.getProjectionMatrix()),
  camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()) // todo just (engine) ?
);

var getPlayerCoordsOnScreen = (playerId) => getCoordsOf(players[playerId].actor.mesh);












//document.addEventListener("keypress", (e) => { if(e.key === '`') isOn = !isOn });


//
//
// setInterval(() => {triggerMouseEvent("mousedown") && triggerMouseEvent("mouseup");}, 1000 )
//
// function triggerMouseEvent (eventType) {
//     var clickEvent = document.createEvent ('MouseEvents');
//     clickEvent.initEvent (eventType, true, true);
//     canvas.dispatchEvent (clickEvent);
// }

// ================== Comm =============
// loggedIn: 0,
// addPlayer: 1,
// removePlayer: 2,
// chat: 3,
// keyDown: 4,
// keyUp: 5,
// sync: 6,
// fire: 7,
// jump: 8,
// die: 9,
// hitThem: 10,
// hitMe: 11,
// collectItem: 12,
// spawnItem: 13,
// respawn: 14,
// startReload: 15,
// reload: 16,
// stowWeapon: 17,
// equipWeapon: 18,
// fireBullet: 19,
// fireShot: 20,
// login: 21,
// invalidName: 22,
// ping: 23,
// pong: 24,
// clientReady: 25,
// requestRespawn: 26,
// status: 27,
