let ClientError = require('./ClientError');
let model = require('./model');
let passwordlib = require('./passwordlib');
let validation = require('./validation');

async function getUserForLoginAsync(identifierObject) {
  let { username, who, userId } = identifierObject;

  if (userId) {
    return await model.getUserAsync(userId);
  }

  if (username) {
    return await model.getUserByUsernameAsync(username);
  }

  if (who) {
    // username is first priority
    let user;
    user = await model.getUserByUsernameAsync(who);
    if (user) {
      return user;
    }

    // userId next
    user = await model.getUserAsync(who);
    if (user) {
      return user;
    }
  }

  return null;
}

async function loginAsync(clientId, identifierObject, password, opts) {
  opts = opts || {};

  let user = await getUserForLoginAsync(identifierObject);
  if (!user) {
    throw ClientError('No such user', 'USER_NOT_FOUND');
  }
  if (await passwordlib.checkUserPasswordAsync(user.userId, password)) {
    await model.startSessionAsync({
      clientId,
      userId: user.userId,
      createdIp: opts.createdIp,
    });
    return user;
  } else {
    throw ClientError('Incorrect password', 'INCORRECT_PASSWORD');
  }
}

async function changePasswordAsync(userId, oldPassword, newPassword) {
  if (!userId) {
    throw ClientError('You need to be logged in to change your password', 'PERMISSION_ERROR');
  }

  if (!(await passwordlib.checkUserPasswordAsync(userId, oldPassword))) {
    throw ClientError('Incorrect password', 'INCORRECT_PASSWORD');
  }

  await validation.validatePasswordAsync(newPassword);

  await passwordlib.setUserPasswordAsync(userId, newPassword);

  return true;
}

async function logoutAsync(clientId) {
  return await model.endSessionAsync(clientId);
}

async function logoutEverywhereAsync(userId) {
  return await model.endAllSessionsForUserAsync(userId);
}

async function logoutEverywhereElseAsync(userId, clientId) {
  return await model.endAllSessionsForUserExceptAsync(userId, clientId);
}


module.exports = {
  getUserForLoginAsync,
  loginAsync,
  logoutAsync,
  logoutEverywhereAsync,
  logoutEverywhereElseAsync,
  changePasswordAsync,
};
