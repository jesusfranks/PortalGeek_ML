const { MeliObject } = require('../utils');
const { pool, pool2 } = require('../bin/dbConnection');

const imglink = "http://images.portalgeek.mx/uploads/";

const postear = async(token) =>{
  const productos = await pool.query('SELECT * FROM products WHERE STATUS = 1'); //DISPONIBLE ACTIVO
  const itembd = await pool2.query('SELECT * FROM ml_items');
  for(var i = 0 ; i < productos.length; i++){
    try {
      const meliObject = new MeliObject(token);
      const user = await meliObject.get('/users/me');
      for(var j = 0 ; j < itembd.length; j++){
        if(productos[i].id == itembd[j].product_id){
          updatePostProducts(productos[i], itembd[j].item_id, token);
          return console.log()
        }
      }
      postProducts(productos[i], user, meliObject);
    } catch(err) {
      console.log('Something went wrong', err);
    }
}
};

async function postProducts(producto, user, meliObject){
  try {
    var images = [];
    const imgs  = await pool.query('SELECT image FROM products_images WHERE product_id = ?',[producto.id]);
    for(var i = 0; i<imgs.length; i++){
      images[i] = {source: imglink + imgs[i].image}
    }
    const predict = await meliObject.get(`/sites/${user.site_id}/category_predictor/predict?title=${encodeURIComponent(producto.title)}`);
    const item = await meliObject.post('/items', {
        title: producto.title,
        category_id: predict.id,
        price: producto.price,
        currency_id: 'MXN',
        available_quantity: producto.available,
        buying_mode: 'buy_it_now',
        listing_type_id: 'Clásica',
        condition: 'new',
        description: producto.description,
        tags: [ 'immediate_payment' ],
        pictures: images
      });
      console.log('Title item:', producto.title);
     const ids = {
        product_id: producto.id,
        item_id: item.id
      }
      await pool2.query('INSERT INTO ml_items set ?', [ids])
      console.log('publicado en la categoría:', predict.name);
      console.log('category probability (0-1):', predict.prediction_probability, predict.variations);
  } catch(err) {
    console.log('Something went wrong', err);
  }
}

async function updatePostProducts(producto, item_id, token){
  try {
    var images = [];
    const imgs  = await pool.query('SELECT image FROM products_images WHERE product_id = ?',[producto.id]);
    for(var i = 0; i<imgs.length; i++){
      images[i] = {source: imglink + imgs[i].image}
    }
    const act = {
      price: producto.price,
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