const sut = require('./mongo-helper');

describe('Mongo Helper', () => {
    afterAll(async () => {
        sut.disconnect();
    });

    beforeEach(async () => {
        await sut.connect(process.env.MONGO_URL);
    });

    test('Should reconnect when getCollection is invoked and client is disconnected', async () => {
        expect(sut.db).toBeTruthy();
        await sut.disconnect();
        expect(sut.db).toBeFalsy();
        await sut.getCollection('any_collection');
        expect(sut.db).toBeTruthy();
    });
});