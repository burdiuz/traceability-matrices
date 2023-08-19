const Koa = require('koa');
const Router = require('@koa/router');
const app = new Koa();
const router = new Router();

router.get('/', (ctx, next) => {
  // ctx.router available

  ctx.body = 'Hello World';
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(3232);

const { compile } = require('pug');

const generateTable = () => {
  compile(`doctype html
  `);
};
