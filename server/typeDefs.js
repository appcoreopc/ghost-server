module.exports = `
scalar Json
scalar Datetime

type Media {
  mediaId: ID! @unique
  name: String
  description: Json
  userId: ID
  instructions: Json
  dimensions: Json
  engineId: ID
  createdTime: Datetime
  updatedTime: Datetime
  user: User
}

type User {
  userId: ID! @unique
  name: String
  location: String
  username: String
  about: Json
  photoUrl: String
  createdTime: Datetime
  updatedTime: Datetime
}

type Engine {
  engineId: ID! @unique
  name: String
  url: String
  createdTime: Datetime
  updatedTime: Datetime
}

type Query {
    hello(name: String): String!
    media(mediaId: ID!): Media
    user(userId: ID!): User
    userByUsername(username: String!): User
    engine(engineId: ID!): Engine
  }

type Mutation {
  updateUser(userId: ID!, update: Json): User
}
`;
