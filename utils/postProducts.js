const { MeliObject } = require('../utils');
const { pool } = require('../bin/dbConnection')

const postear = async(token) =>{
  const productos = await pool.query('SELECT * FROM products WHERE STATUS = 1'); //DISPONIBLE ACTIVO
  for( var i = 0 ; i < productos.length; i++){
    try {
      const meliObject = new MeliObject(token);
      const user = await meliObject.get('/users/me');
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
            postForm(productos[i], user, meliObject);
          }
        }
      } else {
        // SE AGREGA NUEVO ITEM PORQUE NO EXISTE NINGUNO
        postForm(productos[i], user, meliObject);
      }
      */
     postForm(productos[i], user, meliObject);
    } catch(err) {
      console.log('Something went wrong', err);
    }
}
};

async function postForm(productos, user, meliObject){
  try {
    const predict = await meliObject.get(`/sites/${user.site_id}/category_predictor/predict?title=${encodeURIComponent(productos.name)}`);
      await meliObject.post('/items', {
        title: productos.name,
        category_id: predict.id,
        price: productos.price,
        currency_id: 'MXN',
        available_quantity: productos.available,
        buying_mode: 'buy_it_now',
        listing_type_id: 'Clásica',
        condition: 'new',
        description: productos.description,
        tags: [ 'immediate_payment' ],
        pictures: [
          {
            source: productos.image
          }
        ]
      });
      console.log('Title item:', productos.name);
      console.log('publicado en la categoría:', predict.name);
      console.log('category probability (0-1):', predict.prediction_probability, predict.variations);
  } catch(err) {
    console.log('Something went wrong', err);
  }
}


module.exports = postear;