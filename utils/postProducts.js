const { MeliObject } = require('../utils');
const { pool, pool2 } = require('../bin/dbConnection')

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
      images[i] = {source: imgs[i].image}
    }
    const predict = await meliObject.get(`/sites/${user.site_id}/category_predictor/predict?title=${encodeURIComponent(producto.title)}`);
      await meliObject.post('/items', {
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
     /* const ids = {
        product_id: producto.id,
        item_id: 
      }
      await pool2.query('INSERT INTO links set ?', [ids])*/
      console.log('publicado en la categoría:', predict.name);
      console.log('category probability (0-1):', predict.prediction_probability, predict.variations);
  } catch(err) {
    console.log('Something went wrong', err);
  }
}

async function updatePostProducts(producto, item_id, token){
  try {
    const act = {
      title: producto.title,
      price: producto.price,
      currency_id: producto.currency,
      available_quantity: producto.quantity,
      listing_type_id: producto.listing_type,
      condition: producto.condition,
      description: producto.description,
      pictures: [
        {source: producto.image} // se cambia
      ]
    }
    await fetch(`https://api.mercadolibre.com/items/${item_id}?access_token=${token}`,{
      method: "PUT",
      body: JSON.stringify(act)
    })
    .then(res => res.json())
  } catch(err) {
    console.log('Something went wrong', err);
  }
}


module.exports = postear;

/*const items = (await meliObject.get(`/users/${user.id}/items/search`)).results || [];
      if (items.length) {
        const result = [];
        const promises = items.map(item_id => meliObject.get(`/items/${item_id}`));
        for await (item of promises) {
          result.push(item);
        }
        for( var j = 0 ; j < result.length; j++){
          if(result[j].title == productos[i].title){
            // SE ACTUALIZAN DATOS
            const act = {
              price: productos[i].price,
              available_quantity: productos[i].quantity,
              description: productos[i].description,
              pictures: [
                {source: productos[i].image}
              ]
            }
            await fetch(`https://api.mercadolibre.com/items/${result[j].item_id}?access_token=${token}`,{
              method: "PUT",
              body: JSON.stringify(act)
            })
            .then(res => res.json())
            //
          }else{
            // SE AGREGA NUEVO ITEM PORQUE NO EXISTE
            postProducts(productos[i], user, meliObject);
          }
        }
      } else {
        // SE AGREGA NUEVO ITEM PORQUE NO EXISTE NINGUNO
        postProducts(productos[i], user, meliObject);
      }
      */