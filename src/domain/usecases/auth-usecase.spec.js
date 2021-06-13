const { MissingParamError } = require('../../utils/errors');
const AuthUseCase = require('./auth-usecase');

const makeEncrypter = () => {
    class EncrypterSpy {
        async compare (password, hashedPassword) {
            this.password = password;
            this.hashedPassword = hashedPassword;
            return this.isValid;
        }
    }
    const encrypterSpy = new EncrypterSpy();
    encrypterSpy.isValid = true;

    return encrypterSpy;
};

const makeTokenGenerator = () => {
    class TokenGeneratorSPy {
        async generate (userId) {
            this.userId = userId;
            
            return this.accessToken;
        }
    }
    const tokenGeneratorSpy = new TokenGeneratorSPy();
    tokenGeneratorSpy.accessToken = 'any_token';

    return tokenGeneratorSpy;
};

const makeLoadUserByEmailRepository = () => {
    class LoadUserByEmailRepositorySpy {
        async load(email) {
            this.email = email;
            return this.user;
        }
    }
    const loadUserByEmailRepositorySpy = new LoadUserByEmailRepositorySpy();
    loadUserByEmailRepositorySpy.user = {
        id: 'any_id',
        password: 'hashed_password'
    };

    return loadUserByEmailRepositorySpy;
}

const makeSut = () => {
    const encrypterSpy = makeEncrypter();
    const loadUserByEmailRepositorySpy = makeLoadUserByEmailRepository();
    const tokenGeneratorSpy = makeTokenGenerator();
    const sut = new AuthUseCase({
        loadUserByEmailRepository: loadUserByEmailRepositorySpy,
        encrypter: encrypterSpy,
        tokenGenerator: tokenGeneratorSpy
    });

    return {
        sut,
        loadUserByEmailRepositorySpy,
        encrypterSpy,
        tokenGeneratorSpy
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

    test('Should return null if an invalid email is provided', async () => {
        const { sut, loadUserByEmailRepositorySpy } = makeSut();
        loadUserByEmailRepositorySpy.user = null;
        const accessToken =  await sut.auth('invalid_email@email.com', 'any_apssword');
        expect(accessToken).toBeNull();
    });

    test('Should return null if an invalid password is provided', async () => {
        const { sut, encrypterSpy } = makeSut();
        encrypterSpy.isValid = false;
        const accessToken =  await sut.auth('valid_email@email.com', 'invalid_password');
        expect(accessToken).toBeNull();
    });

    test('Should call Encrypter with correct values', async () => {
        const { sut, loadUserByEmailRepositorySpy, encrypterSpy } = makeSut();
        await sut.auth('valid_email@email.com', 'any_password');
        expect(encrypterSpy.password).toBe('any_password');
        expect(encrypterSpy.hashedPassword).toBe(loadUserByEmailRepositorySpy.user.password);
    });

    test('Should call Token generator with correct userId', async () => {
        const { sut, loadUserByEmailRepositorySpy, tokenGeneratorSpy } = makeSut();
        await sut.auth('valid_email@email.com', 'valid_password');
        expect(tokenGeneratorSpy.userId).toBe(loadUserByEmailRepositorySpy.user.id);
    });

    test('Should return an accessToken if correct credentials are provided', async () => {
        const { sut, tokenGeneratorSpy } = makeSut();
        const accessToken = await sut.auth('valid_email@email.com', 'valid_password');
        expect(accessToken).toBe(tokenGeneratorSpy.accessToken);
        expect(accessToken).toBeTruthy();
    });

    test('Should throw if invalid dependencies are provided', async () => {
        const invalid = {};
        const loadUserByEmailRepository = makeLoadUserByEmailRepository();
        const encrypter = makeEncrypter();
        const suts = [
            new AuthUseCase(),
            new AuthUseCase({ loadUserByEmailRepository: null }),
            new AuthUseCase({ loadUserByEmailRepository: invalid }),
            new AuthUseCase({
                loadUserByEmailRepository,
                encrypter: null
            }),
            new AuthUseCase({
                loadUserByEmailRepository,
                encrypter: invalid
            }),
            new AuthUseCase({
                loadUserByEmailRepository,
                encrypter,
                tokenGenerator: null
            }),
            new AuthUseCase({
                loadUserByEmailRepository,
                encrypter,
                tokenGenerator: invalid
            })
        ];
        for (const sut of suts) {
            const authPromise = sut.auth('any_email@email.com', 'any_password');
            expect(authPromise).rejects.toThrow();
        }
    });
});