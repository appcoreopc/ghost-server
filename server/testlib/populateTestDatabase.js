let gq = require('./gq');

async function populateDatabaseAsync() {
  let gqAsync = gq.withClientId('populateDatabase');

  let sharedIds = {};

  // Setup some users and stuff
  let [american, jonathan] = await Promise.all([
    gqAsync(/* GraphQL */ `
      mutation {
        signup(
          user: {
            name: "American McGee"
            location: "Dallas"
            username: "american"
            about: "Made some video games"
            photo: {
              url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/American_McGee.jpg/936px-American_McGee.jpg"
              height: 468
              width: 600
            }
            isTeam: false
          }
          password: "alice"
        ) {
          userId
          username
          name
          location
          about
        }
      }
    `),
    gqAsync(/* GraphQL */ `
      mutation {
        signup(
          user: {
            name: "Jonathan Gay"
            location: "Sebastopol"
            username: "jgay"
            about: "Made some video games and also invented Flash"
            photo: {
              url: "https://static.giantbomb.com/uploads/scale_small/0/5395/323199-spot_gay.jpg"
              height: 160
              width: 160
            }
            isTeam: false
          }
          password: "flash"
        ) {
          userId
          username
          name
          location
          about
        }
      }
    `),
  ]);

  sharedIds.american = american.data.signup.userId;
  sharedIds.jonathan = jonathan.data.signup.userId;

  let [havok, sc2Engine] = await Promise.all([
    gqAsync(/* GraphQL */ `
      mutation {
        addTool(
          tool: {
            # toolId: ID
            name: "Havok"
            url: "https://www.havok.com/"
            about: "Havok Physics offers the fastest, most robust collision detection and physical simulation technology available, which is why it has become the gold standard within the games industry and has been used by leading game developers in over 400 launched titles and many more in development."
            tags: ["physics", "engine"]
          }
        ) {
          toolId
          name
        }
      }
    `),
    gqAsync(/* GraphQL */ `
      mutation {
        addTool(
          tool: {
            # toolId: ID
            name: "SC2 Engine"
            url: "https://starcraft2.com/"
            tags: ["blizzard", "engine"]
          }
        ) {
          toolId
          name
        }
      }
    `),
  ]);
  sharedIds.havok = havok.data.addTool.toolId;
  sharedIds.sc2Engine = sc2Engine.data.addTool.toolId;
  return sharedIds;
}

module.exports = {
  populateDatabaseAsync,
};