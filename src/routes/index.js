const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/tokens');
const { MeliObject } = require('../utils');
const { pool2 } = require('../bin/dbConnection');

require('dotenv').config();

const { SYS_PWD } = process.env;

router.get('/', async(req, res) => {
    res.render('index');
  });

  router.get('/awake', (req, res) => {
    const date = new Date();
    const fecha = date.toDateString().split(" ").join("_");
    const hora = date.getHours().toString();
    const min = date.getMinutes().toString();
    const momento = fecha + "_" + hora + ":" + min;
    console.log("Me despertaron: "+ momento);
    res.send("Me despertaron: "+ momento);
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
      if (items.length) {
        const result = [];
        const promises = items.map(item_id => meliObject.get(`/items/${item_id}`));
        for await (item of promises) {
          result.push(item);
        }
        res.render('posts', { items: result });
      } else {
        res.render('posts');
      }
    } catch(err) {
      console.log('Something went wrong', err);
      res.status(500).send(`Error! ${err}`);
    }
  });

router.get('/settings', async (req, res) =>{
  if(req.session.user !== true){
    res.redirect('/');
  } else{
    const query = await pool2.query('SELECT value from commissions where id = 1');
    res.render('settings', { value: query[0]} );
  }
});

router.post('/saveSettings', async (req, res) =>{
  try {
    await pool2.query('UPDATE commissions SET value =' + req.body.commission + ' WHERE id = 1');
    res.redirect('/settings');
  } catch (error) {
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