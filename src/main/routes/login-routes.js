const loginRouter = require('../composers/login-router-composer');
const routerAdapter = require('../adapters/express-router-adapter');

module.exports = router => {
    router.post('/login', routerAdapter.adapt(loginRouter));
};