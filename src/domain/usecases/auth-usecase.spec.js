class AuthUseCase {
    async auth (email) {
        if (!email) throw new Error();
    }
}

describe('Auth UseCase', () => {
    test('Should throw if no email is provided', async () => {
        const sut = new AuthUseCase();
        const authPromise = sut.auth();
        expect(authPromise).rejects.toThrow();
    });
});