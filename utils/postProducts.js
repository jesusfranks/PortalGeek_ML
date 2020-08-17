const { MeliObject } = require('../utils');
const { pool } = require('../bin/dbConnection')

const postear = async(token) =>{
  const productos = await pool.query('SELECT * FROM products WHERE STATUS = 1'); //DISPONIBLE ACTIVO
  for( var i = 0 ; productos.length; i++){
    //console.log(productos[i])
    try {
      const meliObject = new MeliObject(token);
      const user = await meliObject.get('/users/me');
      const predict = await meliObject.get(`/sites/${user.site_id}/category_predictor/predict?title=${encodeURIComponent(productos[i].name)}`);
      await meliObject.post('/items', {
        title: productos[i].name,
        category_id: predict.id,
        price: productos[i].price,
        currency_id: 'MXN',
        available_quantity: productos[i].available,
        buying_mode: 'buy_it_now',
        listing_type_id: 'Clásica',
        condition: 'new',
        description: productos[i].description,
        tags: [ 'immediate_payment' ],
        pictures: [
          {
            source: productos[i].image
          }
        ]
      });
      console.log('publicado en la categoría:', predict.name);
      console.log('category probability (0-1):', predict.prediction_probability, predict.variations);
    } catch(err) {
      console.log('Something went wrong', err);
    }
}
};


module.exports = postear;