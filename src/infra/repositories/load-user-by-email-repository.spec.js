const { MongoClient } = require("mongodb");
const LoadUserByEmailRepository = require('./load-user-by-email-repository');

let connection, db;

const makeSut = () => {
    const userModel = db.collection("users");
    const sut = new LoadUserByEmailRepository(userModel);

    return { userModel, sut };
};

describe("LoadUserByEmail Repository", () => {
  beforeAll(async () => {
    connection = await MongoClient.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = await connection.db();
  });

  beforeEach(async () => {
      await db.collection('users').deleteMany();
  });

  afterAll(async () => {
    await connection.close();
  });

  test("Should return null if no user is found", async () => {
    const { sut } = makeSut();
    const user = await sut.load("invalid_email");
    expect(user).toBeNull();
  });

  test("Should return a user if user is found", async () => {
    const { userModel, sut } = makeSut();
    const fakeUser = await userModel.insertOne({ 
        email: 'valid_email@mail.com',
        name: 'any_name',
        age: 50,
        password: 'hashed_password',
        state: 'any',
     });
    const user = await sut.load("valid_email@mail.com");
    expect(user).toEqual({
        _id: fakeUser.ops[0]._id,
        password: fakeUser.ops[0].password
    });
  });
});
