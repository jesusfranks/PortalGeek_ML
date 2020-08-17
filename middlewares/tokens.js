const meli = require('mercadolibre');
const { pool2 } = require('../bin/dbConnection')
require('dotenv').config();

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;

const tokens = {
  access_token: null,
  token_type: null,
  expires_in: null,
  scope: null,
  user_id: null,
  refresh_token: null
};

const setTokens = async(newTokens) => {
  const date = new Date();
  const time_threshold = 6; //el token dura 6 horas
  date.setHours(date.getHours() + time_threshold, 0, 0, 0);
  tokens.expires_in = date;
  tokens.access_token = newTokens.access_token;
  tokens.token_type = newTokens.token_type;
  tokens.scope = newTokens.scope;
  tokens.user_id = newTokens.user_id;
  tokens.refresh_token = newTokens.refresh_token;
  await pool2.query('INSERT INTO tokens SET ?', [tokens]);
};

const validateToken = (req, res, next) => {
  if (req.session.user) {
    if (!tokens.access_token || (new Date()) >= tokens.expires_in) {
      const redirect_uri = REDIRECT_URI + req.baseUrl + req.path;
      const { code } = req.query;
      const meliObject = new meli.Meli(CLIENT_ID, CLIENT_SECRET);
      if (code) {
        meliObject.authorize(code, redirect_uri, (error, response) => {
          if (error) {
            throw error;
          }
          setTokens(response);
          res.locals.access_token = tokens.access_token;
          //console.log('tokens', tokens)
          res.redirect(redirect_uri);
        });
      } else {
        res.redirect(meliObject.getAuthURL(redirect_uri));
      }
    } else {
      res.locals.access_token = tokens.access_token;
      next();
    }
  } else {
    res.redirect('/');
  }
}

module.exports = {
  validateToken
};