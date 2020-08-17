const express = require('express');
const router = express.Router();
const multer = require('multer');
const { validateToken } = require('../middlewares/tokens');
const { MeliObject } = require('../utils');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './public/pictures'),
    filename: (req, file, cb) => cb(null, Date.now() + file.originalname)
  });
  
const upload = multer({ storage });


router.get('/form', validateToken, async(req, res) =>{
    try {
      const meliObject = new MeliObject(res.locals.access_token);
      const user = await meliObject.get('/users/me');
      const categories = await meliObject.get(`/sites/${user.site_id}/categories`);
      const currencies = await meliObject.get('/currencies');
      const listing_types = await meliObject.get(`/sites/${user.site_id}/listing_types`);
      res.render('form', {
        user,
        categories,
        currencies,
        listing_types
      });
    } catch (err) {
      console.log('Something went wrong', err);
      res.status(500).send(`Error! ${err}`);
    }
  });

  router.post('/post', validateToken, upload.single('picture'), async (req, res) => {
    try {
      const meliObject = new MeliObject(res.locals.access_token);
      const user = await meliObject.get('/users/me');
      console.log('user', user)
      const predict = await meliObject.get(`/sites/${user.site_id}/category_predictor/predict?title=${encodeURIComponent(req.body.title)}`);
      await meliObject.post('/items', {
        title: req.body.title,
        category_id: predict.id,
        price: req.body.price,
        currency_id: req.body.currency,
        available_quantity: req.body.quantity,
        buying_mode: 'buy_it_now',
        listing_type_id: req.body.listing_type,
        condition: req.body.condition,
        description: req.body.description,
        tags: [ 'immediate_payment' ],
        pictures: [
          {
            source: `${req.protocol}://${req.get('host')}/pictures/${req.file.filename}`
          }
        ]
      });
      console.log('publicado en la categoría:', predict.name);
      console.log('category probability (0-1):', predict.prediction_probability, predict.variations);
      res.redirect('/posts');
    } catch(err) {
      console.log('Something went wrong', err);
      res.status(500).send(`Error! ${err}`);
    }
  });

module.exports = router;