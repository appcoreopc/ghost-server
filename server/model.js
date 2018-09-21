let data = require('./data');
let db = require('./db');
let idlib = require('./idlib');

async function newPlayRecordAsync(obj) {
  obj.playRecordId = obj.playRecordId || idlib.createId('playRecord');
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
  return await data.updateObjectAsync(obj.playRecordId, 'playRecord', obj, {
    column: 'playRecordId',
  });
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
  return await data.writeNewObjectAsync(obj, 'media', { autoId: true });
}

async function updateMediaAsync(obj) {
  return await data.updateObjectAsync(obj.mediaId, 'media', obj, { column: 'mediaId' });
}

async function newEngineAsync(obj) {
  return await data.writeNewObjectAsync(obj, 'engine', { autoId: true });
}

async function updateEngineAsync(obj) {
  return await data.updateObjectAsync(obj, 'engine', { column: 'engineId' });
}

async function getAllEnginesAsync() {
  let q = 'SELECT * FROM "engine"';
  let results = await db.queryAsync(q);
  return data.objectsFromResults(results, 'engineId');
}

async function recordProfileView(viewingUserId, viewedUserId, when) {
  when = when || new Date();
  let result = await db.queryAsync(
    'INSERT INTO "profileView" ("viewedProfileUserId", "viewerUserId", "viewTime") VALUES ($1, $2, $3);',
    [viewedUserId, viewingUserId, when]
  );
  assert.equal(result.rowCount, 1);
}

async function getTotalProfileViews(userId) {
  let result = await db.queryAsync(
    'SELECT COUNT(1)::integer AS "views" FROM "profileView" WHERE "viewedProfileUserId" = $1',
    [userId]
  );
  return result.rows[0].views;
}

async function getTotalMediaPlays(mediaId) {
  let result = await db.queryAsync(
    'SELECT COUNT(1)::integer AS "views" FROM "playRecord" WHERE "mediaId" = $1',
    [mediaId]
  );
  return result.rows[0].views;
}

async function getEngineAsync(engineId) {
  return await data.getObjectAsync(engineId, 'engine', { column: 'engineId' });
}

async function newUserAsync(obj) {
  return await data.writeNewObjectAsync(obj, 'user', {
    column: 'userId',
    autoId: true,
    autoIdSource: obj.username,
  });
}

async function getUserAsync(userId) {
  return await data.getObjectAsync(userId, 'user', { column: 'userId' });
}

async function updateUserAsync(obj) {
  return await data.updateObjectAsync(obj.userId, 'user', obj, { column: 'userId' });
}

async function _deleteUserAsync(userId) {
  return await data._deleteObjectAsync(userId, 'user', { column: 'userId' });
}

async function getUserByUsernameAsync(username) {
  let results = await db.queryAsync('SELECT * FROM "user" WHERE "username" = $1;', [username]);
  if (results.rowCount > 0) {
    if (results.rowCount > 1) {
      console.warn("Multiple users with username '" + username + "'");
    }
    let objs = data.objectsListFromResults(results);
    return objs[0];
  }
}

async function getPlaylistAsync(playlistId) {
  return await data.getObjectAsync(playlistId, 'playlist', { column: 'playlistId' });
}

async function updatePlaylistAsync(obj) {
  return await data.updateObjectAsync(obj.playlistId, 'playlist', obj, { column: 'playlistId' });
}

async function deletePlaylistAsync(playlistId) {
  return await data.updateObjectAsync(
    playlistId,
    'playlist',
    { deleted: true },
    { column: 'playlistId' }
  );
}

async function getPlaylistsForUser(userId) {
  let results = await db.queryAsync(
    'SELECT * FROM "playlist" WHERE "userId" = $1 ORDER BY "updatedTime" DESC',
    [userId]
  );
  return data.objectsListFromResults(results);
}

async function newPlaylistAsync(obj) {
  return await data.writeNewObjectAsync(obj, 'playlist', { column: 'playlistId', autoId: true });
}

async function multigetMediaAsync(mediaIdList, opts) {
  return await data.multigetObjectsAsync(mediaIdList, 'media', { column: 'mediaId', ...opts });
}

async function newSessionAsync(userId, opts) {
  let sessionId =
    'session:' +
    userId +
    '/' +
    moment(Date.now()).format('YYYYMMDDhhmmss') +
    '+' +
    idlib.makeUuid(16);

  return await data.writeNewObjectAsync(
    {
      sessionId,
      userId,
      ...opts,
    },
    'session',
    { column: 'sessionId' }
  );
}

async function getSessionAsync(sessionId) {
  return await data.getObjectAsync(sessionId, 'session', { column: 'sessionId' });
}

async function getSessionsForUserAsync(userId) {
  let results = await db.queryAsync('SELECT * FROM "session" WHERE "userId" = $1', [userId]);
  return data.objectsFromResults(results);
}

async function newTeamAsync(obj) {
  let teamObj = {
    ...obj,
    isTeam: true,
  };
  return await data.writeNewObjectAsync(teamObj, 'user', {
    column: 'userId',
    autoId: true,
    autoIdSource: teamObj.name,
  });
}

async function getTeamsForUserAsync(userId) {
  let r = db.replacer();
  let results = await db.queryAsync(
    'SELECT * FROM "user" WHERE "roles" @> ' +
      r.json({ members: [userId] }) +
      ' OR "roles" @> ' +
      r.json({ admins: [userId] }) +
      ';',
    r.values()
  );
  return data.objectsListFromResults(results, 'userId');
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
  recordProfileView,
  getTotalProfileViews,
  getTotalMediaPlays,
  getEngineAsync,
  newUserAsync,
  updateUserAsync,
  getUserAsync,
  getUserByUsernameAsync,
  _deleteUserAsync,
  getPlaylistAsync,
  getPlaylistsForUser,
  updatePlaylistAsync,
  deletePlaylistAsync,
  newPlaylistAsync,
  multigetMediaAsync,
  newSessionAsync,
  getSessionAsync,
  getSessionsForUserAsync,
  newTeamAsync,
  getTeamsForUserAsync,
};
