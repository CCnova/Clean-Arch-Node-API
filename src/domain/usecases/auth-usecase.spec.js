const { MissingParamError, InvalidParamError } = require('../../utils/errors');
const AuthUseCase = require('./auth-usecase');

const makeSut = () => {
    class LoadUserByEmailRepositorySpy {
        async load(email) {
            this.email = email;
        }
    }
    const loadUserByEmailRepositorySpy = new LoadUserByEmailRepositorySpy();
    const sut = new AuthUseCase(loadUserByEmailRepositorySpy);

    return {
        sut,
        loadUserByEmailRepositorySpy
    }
};

describe('Auth UseCase', () => {
    test('Should throw if no email is provided', async () => {
        const { sut } = makeSut();
        const authPromise = sut.auth();
        expect(authPromise).rejects.toThrow(new MissingParamError('email'));
    });

    test('Should throw if no password is provided', async () => {
        const { sut } = makeSut();
        const authPromise = sut.auth('any_email@mail.com');
        expect(authPromise).rejects.toThrow(new MissingParamError('password'));
    });

    test('Should call LoadUserByEmailRepository with correct email', async () => {
        const { sut, loadUserByEmailRepositorySpy } = makeSut();
        sut.auth('any_email@email.com', 'any_password');
        expect(loadUserByEmailRepositorySpy.email).toBe('any_email@email.com');
    });

    test('Should throw if no LoadUserByEmailRepository is provided', async () => {
        const sut = new AuthUseCase();
        const authPromise = sut.auth('any_email@email.com', 'any_password');
        expect(authPromise).rejects.toThrow(new MissingParamError('loadUserByEmailRepository'));
    });

    test('Should throw if LoadUserByEmailRepository has no load method', async () => {
        const sut = new AuthUseCase({});
        const authPromise = sut.auth('any_email@email.com', 'any_password');
        expect(authPromise).rejects.toThrow(new InvalidParamError('loadUserByEmailRepository'));
    });

    test('Should return LoadUserByEmailRepository null if ', async () => {
        const { sut } = makeSut();
        const accessToken =  await sut.auth('invalid_email@email.com', 'any_apssword');
        expect(accessToken).toBe(null);
    });
});