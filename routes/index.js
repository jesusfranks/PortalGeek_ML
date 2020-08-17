const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/tokens');
const { MeliObject } = require('../utils');

require('dotenv').config();

const { SYS_PWD } = process.env;

router.get('/', (req, res) => {
    res.render('index');
    console.log(req.session.user)
  });

router.post('/login', (req, res) => {
  if (req.body.password === SYS_PWD) {
    req.session.user = true;
    console.log('req.session.user', req.session.user)
    res.redirect('/home');
  } else {
    res.redirect('/?error=password-incorret');
  }
});

router.get('/home', validateToken, (req, res) => {
    res.render('home');
});

router.get('/posts', validateToken, async (req, res) => {
    try {
      const meliObject = new MeliObject(res.locals.access_token);
      const user = await meliObject.get('/users/me');
      const items = (await meliObject.get(`/users/${user.id}/items/search`)).results || [];
      console.log(items);
      if (items.length) {
        const result = [];
        const promises = items.map(item_id => meliObject.get(`/items/${item_id}`));
        for await (item of promises) {
          result.push(item);
        }
        res.render('posts', { items: result });
      } else {
        //res.status(404).send('no items were found :(');
        res.render('posts');
      }
    } catch(err) {
      console.log('Something went wrong', err);
      res.status(500).send(`Error! ${err}`);
    }
  });

// TODO: exemplo de notificaciones
router.get('/notifications', (req, res) => {
    res.send('ok');
    console.log(req.body);
    // Recomendamos enviar un estado 200 lo antes posible.
    // Puedes hacer algo asincrónico de inmediato. Por ejemplo
    // guardar en una base de datos en tiempo real, como firebase.
  });

module.exports = router;