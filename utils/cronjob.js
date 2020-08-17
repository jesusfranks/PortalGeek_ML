const CronJob = require('cron').CronJob;
const fetch = require('node-fetch');
const postear = require("./postProducts");
const { pool2 } = require("../bin/dbConnection");
require('dotenv').config();

const { CLIENT_ID, CLIENT_SECRET } = process.env;

//https://crontab.guru/
const cron530 = "30 5 * * *" // 5:30 am
const cron5h = "0 */5 * * *"

//------------------------------CronJobs
var job = new CronJob(cron530, async() => {
  const tkRows = await pool2.query('SELECT * FROM tokens ORDER BY id_tokens DESC LIMIT 1');
  const tk = tkRows[0];
  postear(tk.access_token);
  console.log('Postear', momento());
},null, true, "America/Mexico_City");

var rTokenJob = new CronJob(cron5h, async() => {
  const tkRows = await pool2.query('SELECT * FROM tokens ORDER BY id_tokens DESC LIMIT 1');
  const tk = tkRows[0];
  const ppp = {
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: tk.refresh_token
  }
  await fetch("https://api.mercadolibre.com/oauth/token",{
    method: "POST",
    body: JSON.stringify(ppp)
  })
  .then(res => res.json())
  .then(data => obj = data)
  .then(async() => {
    console.log('obj', obj)
    await pool2.query('INSERT INTO tokens SET ?', [obj])
})
  console.log('Set new token', momento());
},null, true, "America/Mexico_City");

//------------------------------helpers

function momento(){
  const date = new Date();
  const fecha = date.toDateString().split(" ").join("_");
  const hora = date.getHours().toString();
  const min = date.getMinutes().toString();
  const momento = fecha + "_" + hora + ":" + min;
  return momento;
}

module.exports = {
  job,
  rTokenJob
};