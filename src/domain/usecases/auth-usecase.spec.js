const { MissingParamError } = require('../../utils/errors');

class AuthUseCase {
    async auth (email, password) {
        if (!email) throw new MissingParamError();
        if (!password) throw new MissingParamError();
    }
}

describe('Auth UseCase', () => {
    test('Should throw if no email is provided', async () => {
        const sut = new AuthUseCase();
        const authPromise = sut.auth();
        expect(authPromise).rejects.toThrow(new MissingParamError('email'));
    });

    test('Should throw if no password is provided', async () => {
        const sut = new AuthUseCase();
        const authPromise = sut.auth();
        expect(authPromise).rejects.toThrow(new MissingParamError('password'));
    });
});