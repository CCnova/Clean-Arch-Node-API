const LoginRouter = require('./login-router');
const { UnauthorizedError, ServerError } = require('../errors');
const { MissingParamError, InvalidParamError } = require('../../utils/errors');

const makeSut = () => {
    const authUseCaseSpy = makeAuthUseCase();
    const emailValidatorSpy = makeEmailValidator();
    const sut = new LoginRouter({ authUseCase: authUseCaseSpy, emailValidator: emailValidatorSpy });

    return {
        sut,
        authUseCaseSpy,
        emailValidatorSpy
    };
};

const makeEmailValidator = () => {
    class EmailValidatorSpy {
        constructor () {
            this.isEmailValid = true;
        }

        isValid (email) {
            this.email = email;
            return this.isEmailValid;
        }
    }
    const emailValidatorSpy = new EmailValidatorSpy();
    emailValidatorSpy.isEmailValid = true;
    
    return emailValidatorSpy;
};

const makeAuthUseCase = () => {
    class AuthUseCaseSpy {
        async auth (email, password) {
            this.email = email;
            this.password = password;
            return this.accessToken;
        }
    }
    const authUseCaseSpy = new AuthUseCaseSpy();
    authUseCaseSpy.accessToken = 'valid_token';

    return authUseCaseSpy;
};

const makeAuthUseCaseWithError = () => {
    class AuthUseCaseSpy {
        async auth () {
            throw new Error();
        }
    }

    return new AuthUseCaseSpy();
};

const makeEmailValidatorWithError = () => {
    class EmailValidatorSpy {
        isValid () {
            throw new Error();
        }
    }

    return new EmailValidatorSpy();
}

describe('Login Router', () => {
    test('Should return 400 if no email is provided', async () => {
        const { sut } = makeSut();
        const httpRequest = {
            body: {
                password: 'any_password'
            }
        };
        const httpResponse = await sut.route(httpRequest);
        expect(httpResponse?.statusCode).toBe(400);
        expect(httpResponse?.body).toEqual(new MissingParamError('email'))
    });

    test('Should return 400 if no password is provided', async () => {
        const { sut } = makeSut();
        const httpRequest = {
            body: {
                email: 'any_email@email.com'
            }
        };
        const httpResponse = await sut.route(httpRequest);
        expect(httpResponse?.statusCode).toBe(400);
    });

    test('Should return 500 if no httpRequest is provided', async () => {
        const { sut } = makeSut();
        const httpResponse = await sut.route(undefined);
        expect(httpResponse?.statusCode).toBe(500);
        expect(httpResponse?.body).toEqual(new ServerError())
    });

    test('Should return 500 if httpRequest has no body', async () => {
        const { sut } = makeSut();
        const httpRequest = {};
        const httpResponse = await sut.route(httpRequest);
        expect(httpResponse?.statusCode).toBe(500);
        expect(httpResponse?.body).toEqual(new ServerError())
    });

    test('Should call AuthUseCase with correct params', async () => {
        const { sut, authUseCaseSpy } = makeSut();
        const httpRequest = {
            body: {
                email: 'any_email@email.com',
                password: 'any_password'
            }
        };
        await sut.route(httpRequest);
        expect(authUseCaseSpy.email).toBe(httpRequest.body.email);
        expect(authUseCaseSpy.password).toBe(httpRequest.body.password);
    });

    test('Should return 401 when invalid credentials are provided', async () => {
        const { sut, authUseCaseSpy } = makeSut();
        authUseCaseSpy.accessToken = null;
        const httpRequest = {
            body: {
                email: 'invalid_email@email.com',
                password: 'invalid_password'
            }
        };
        const httpResponse = await sut.route(httpRequest);
        expect(httpResponse.statusCode).toBe(401);
        expect(httpResponse.body).toEqual(new UnauthorizedError());
    });

    test('Should return 200 when valid credentials are provided', async () => {
        const { sut, authUseCaseSpy } = makeSut();
        const httpRequest = {
            body: {
                email: 'valid_email@email.com',
                password: 'valid_password'
            }
        };
        const httpResponse = await sut.route(httpRequest);
        expect(httpResponse.statusCode).toBe(200);
        expect(httpResponse.body.accessToken).toEqual(authUseCaseSpy.accessToken);
    });

    test('Should return 400 if invalid email is provided', async () => {
        const { sut, emailValidatorSpy } = makeSut();
        emailValidatorSpy.isEmailValid = false;
        const httpRequest = {
            body: {
                email: 'invalid_email@email.com',
                password: 'any_password'
            }
        };
        const httpResponse = await sut.route(httpRequest);
        expect(httpResponse?.statusCode).toBe(400);
        expect(httpResponse?.body).toEqual(new InvalidParamError('email'));
    });

    test('Should call EmailValidator with correct email', async () => {
        const { sut, emailValidatorSpy } = makeSut();
        const httpRequest = {
            body: {
                email: 'any_email@email.com',
                password: 'any_password'
            }
        };
        await sut.route(httpRequest);
        expect(emailValidatorSpy.email).toBe(httpRequest.body.email);
    });

    test('Should throw if invalid dependencies are provided', async () => {
        const invalid = {};
        const authUseCase = makeAuthUseCase();
        const suts = [
            new LoginRouter(),
            new LoginRouter({}),
            new LoginRouter({ authUseCase: invalid }),
            new LoginRouter({ authUseCase: authUseCase }),
            new LoginRouter({ authUseCase: authUseCase, emailValidator: invalid }),
        ];
        for (const sut of suts) {
            const httpRequest = {
                body: {
                    email: 'any_email@email.com',
                    password: 'any_password'
                }
            };
            const httpResponse = await sut.route(httpRequest);
            expect(httpResponse.statusCode).toBe(500);
            expect(httpResponse?.body).toEqual(new ServerError());
        }
    });

    test('Should throw if any dependency throw', async () => {
        const authUseCase = makeAuthUseCase();
        const suts = [
            new LoginRouter({
                authUseCase: makeAuthUseCaseWithError()
            }),
            new LoginRouter({
                authUseCase,
                emailValidator: makeEmailValidatorWithError()
            }),
        ];
        for (const sut of suts) {
            const httpRequest = {
                body: {
                    email: 'any_email@email.com',
                    password: 'any_password'
                }
            };
            const httpResponse = await sut.route(httpRequest);
            expect(httpResponse.statusCode).toBe(500);
            expect(httpResponse?.body).toEqual(new ServerError())
        }
    });
});