const { MeliObject } = require('../utils');
const { pool, pool2 } = require('../bin/dbConnection');
const fetch = require('node-fetch');

const imglink = "https://portalgeek.mx/assets/uploads/";

const postear = async(token) =>{
  const productos = await pool.query('SELECT * FROM products WHERE status = 1'); //DISPONIBLE ACTIVO
  const itembd = await pool2.query('SELECT * FROM ml_items');
  for(var i = 0 ; i < productos.length; i++){
    try {
      const meliObject = new MeliObject(token);
      const user = await meliObject.get('/users/me');
      for(var j = 0 ; j < itembd.length; j++){
        if(productos[i].id == itembd[j].product_id){
          updatePostProducts(productos[i], itembd[j].item_id, token);
          return 0;
        }
      }
      postProducts(productos[i], user, meliObject);
    } catch(err) {
      console.log('Something went wrong', err);
    }
  }
};

async function postProducts(producto, user, meliObject){
  //console.log('producto', producto)
  try {
    var images = [];
    const imgs  = await pool.query('SELECT image FROM products_images WHERE product_id = ?',[producto.id]);
    //console.log('imgs', imgs)
    images.push({source: producto.image});
    for(var i = 0; i < imgs.length; i++){
      images.push({source: imglink + imgs[i].image});
    }
    //console.log('images', images);
    const aumento = await pool2.query('SELECT value FROM commissions WHERE id = 1');
    const vAumento = ((1+(aumento[0].value/100)) * producto.price);
    const predict = await meliObject.get(`/sites/${user.site_id}/category_predictor/predict?title=${encodeURIComponent(producto.name)}`);
    const item = await meliObject.post('/items', {
        title: producto.name,
        category_id: predict.id,
        price: vAumento,
        currency_id: 'MXN',
        available_quantity: producto.available,
        buying_mode: 'buy_it_now',
        listing_type_id: 'gold_special', //free, bronze, silver, gold, gold_special, gold_premium, gold_pro
        condition: 'new',
        description: producto.description,
        tags: [ 'immediate_payment' ],
        pictures: images,
        attributes: [
          {
            id: 'BRAND',
            value_name: producto.brand
          },
          {
            id: 'MODEL',
            value_name: producto.model
          }
        ]
      });
    console.log('title', producto.name)
    console.log('item:', item);
    const ids = {
      product_id: producto.id,
      item_id: item.id
    }
    await pool2.query('INSERT INTO ml_items set ?', [ids]);
    console.log('publicado en la categoría:', predict.name);
    console.log('category probability (0-1):', predict.prediction_probability, predict.variations);
    console.log('----------------------------------------------------------------------');
  } catch(err) {
    console.log('Something went wrong', err);
  }
}

async function updatePostProducts(producto, item_id, token){
  var images = [];
  const imgs  = await pool.query('SELECT image FROM products_images WHERE product_id = ?',[producto.id]);
  images.push({source: producto.image});
  for(var i = 0; i < imgs.length; i++){
    images.push({source: imglink + imgs[i].image});
  }
  const aumento = await pool2.query('SELECT value FROM commissions WHERE id = 1');
  const vAumento = ((1+(aumento[0].value/100)) * producto.price);
  try {
    const act = {
      price: vAumento,
      available_quantity: producto.quantity,
      pictures: images
    }
    const des = {
      plain_text: producto.description
    }
    await fetch(`https://api.mercadolibre.com/items/${item_id}?access_token=${token}`,{
      method: "PUT",
      body: JSON.stringify(act)
    });
    await fetch(`https://api.mercadolibre.com/items/${item_id}/description?access_token=${token}`,{
      method: "PUT",
      body: JSON.stringify(des)
    });
  } catch(err) {
    console.log('Something went wrong', err);
  }
}

module.exports = postear;