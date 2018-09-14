let data = require('./data');
let db = require('./db');
let id = require('./id');

async function newPlayRecordAsync(obj) {
  obj.playRecordId = obj.playRecordId || id.createId('pr');
  return await data.writeNewObjectAsync(obj, 'playRecord');
}

async function writeGhostSignupAsync(resultData) {
  let userId = resultData.data.user.id;
  let signupEmail = resultData.data.user.email;
  let signupTime = resultData.data.user.created_at;
  let signupUsername = resultData.data.user.username;
  await db.queryAsync(
    `
    INSERT INTO "ghostSignups" ( 
      "signupTime",
      "userId",
      "signupUsername",
      "signupEmail"
    ) VALUES ($1, $2, $3, $4)`,
    [signupTime, userId, signupUsername, signupEmail]
  );
}

async function getPlayRecordsAsync(mediaId, opts) {
  opts = opts || {}; // userId, sortBy
  let limit = opts.limit || 30;
  let n = 0;
  let q = 'SELECT * FROM "playRecord" WHERE "mediaId" = $' + ++n;
  let params = [mediaId];
  if (opts.userId) {
    q += ' AND "userId" = $' + ++n;
    params.push(opts.userId);
  }
  let sortBy = opts.sortBy || 'score';
  q += ' ORDER BY ' + JSON.stringify(sortBy) + ' DESC LIMIT $' + ++n;
  params.push(limit);
  let results = await db.queryAsync(q, params);
  return data.objectsListFromResults(results);
}

async function updatePlayRecordAsync(obj) {
  return await data.updateObjectAsync(obj.playRecordId, 'playRecord');
}

async function getMediaAsync(mediaId) {
  return await data.getObjectAsync(mediaId, 'media');
}

async function getAllMediaAsync() {
  let q = 'SELECT * FROM "media" ORDER BY "updatedTime" DESC';
  let results = await db.queryAsync(q);
  return data.objectsListFromResults(results);
}

async function newMediaAsync(obj) {
  obj.mediaId =
    obj.mediaId ||
    (await id.createUniqueIdAsync('media', obj.name, async (mediaId) => {
      return data.objectExistsAsync(mediaId, 'media', 'mediaId');
    }));
  return await data.writeNewObjectAsync(obj, 'media');
}

async function updateMediaAsync(obj) {
  return await data.updateObjectAsync(obj, 'media', { column: 'mediaId' });
}

async function newEngineAsync(obj) {
  obj.engineId =
    obj.engineId ||
    (await id.createUniqueIdAsync('engine', obj.name, async (engineId) => {
      return data.objectExistsAsync(engineId, 'engine', 'engineId');
    }));
  return await data.writeNewObjectAsync(obj, 'engine');
}

async function updateEngineAsync(obj) {
  return await data.updateObjectAsync(obj, 'engine', { column: 'engineId' });
}

async function getAllEnginesAsync() {
  let q = 'SELECT * FROM "engine"';
  let results = await db.queryAsync(q);
  return data.objectsFromResults(results, 'engineId');
}

module.exports = {
  writeGhostSignupAsync,
  newPlayRecordAsync,
  getPlayRecordsAsync,
  updatePlayRecordAsync,
  getMediaAsync,
  getAllMediaAsync,
  newMediaAsync,
  updateMediaAsync,
  newEngineAsync,
  updateEngineAsync,
  getAllEnginesAsync,
};