const express = require('express');
const router = express.Router();
const multer = require('multer');
const fetch = require('node-fetch');
const { validateToken } = require('../middlewares/tokens');
const { MeliObject } = require('../utils');
const { pool2 } = require('../bin/dbConnection')

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './public/pictures'),
    filename: (req, file, cb) => cb(null, Date.now() + file.originalname)
  });
  
const upload = multer({ storage });

//----ROUTES
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

router.get('/formEdit/:item_id', validateToken, async(req, res) =>{
  const { item_id } = req.params;
  try {
    const meliObject = new MeliObject(res.locals.access_token);
    const user = await meliObject.get('/users/me');
    const categories = await meliObject.get(`/sites/${user.site_id}/categories`);
    const currencies = await meliObject.get('/currencies');
    const listing_types = await meliObject.get(`/sites/${user.site_id}/listing_types`);
    const item = await meliObject.get(`/items/${item_id}`);
    res.render('formEdit', {
      item,
      categories,
      currencies,
      listing_types
    });
  } catch (err) {
    console.log('Something went wrong', err);
    res.status(500).send(`Error! ${err}`);
  }
});

router.post('/postE/:item_id', validateToken, upload.single('picture'), async (req, res) => {
  const item_id = req.params;
  try {
    const meliObject = new MeliObject(res.locals.access_token);
    const item = await meliObject.get(`/items/${item_id}`);
    updatePostForm(req, res, item)
  } catch(err) {
  console.log('Something went wrong', err);
  res.status(500).send(`Error! ${err}`);
  }
});

router.post('/post', validateToken, upload.single('picture'), async (req, res) => {
  try {
    const meliObject = new MeliObject(res.locals.access_token);
    const user = await meliObject.get('/users/me');
    postForm(req, res, user , meliObject);
  } catch(err) {
  console.log('Something went wrong', err);
  res.status(500).send(`Error! ${err}`);
  }
});

//---- Helpers

async function postForm(req, res, user, meliObject){
    try {
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
          {source: `${req.protocol}://${req.get('host')}/pictures/${req.file.filename}`}
        ]
      });
      console.log('Title item:', req.body.title);
      console.log('publicado en la categoría:', predict.name);
      console.log('category probability (0-1):', predict.prediction_probability, predict.variations);
      res.redirect('/posts');
    } catch(err) {
      console.log('Something went wrong', err);
      res.status(500).send(`Error! ${err}`);
    }
  }

async function updatePostForm(req, res, item){
  try {
    const act = {
      price: req.body.price,
      currency_id: req.body.currency,
      available_quantity: req.body.quantity,
      listing_type_id: req.body.listing_type,
      condition: req.body.condition,
      description: req.body.description,
      pictures: [
        {source: `${req.protocol}://${req.get('host')}/pictures/${req.file.filename}`}
      ]
    }
    await fetch(`https://api.mercadolibre.com/items/${item.item_id}?access_token=${res.locals.access_token}`,{
      method: "PUT",
      body: JSON.stringify(act)
    })
    .then(res => res.json())
    res.redirect('/posts');
  } catch(err) {
    console.log('Something went wrong', err);
    res.status(500).send(`Error! ${err}`);
  }
}


module.exports = router;