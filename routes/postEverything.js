const express = require('express');
const router = express.Router();
const { validateToken } = require('../middlewares/tokens');
const postear = require("../utils/postProducts");

router.post('/postear', validateToken, (req, res)=>{
  postear(res.locals.access_token);
  res.redirect('/posts');
});


module.exports = router;