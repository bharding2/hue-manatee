const Router = require('express').Router;
const Light = require(__dirname + '/../models/light');
const Bridge = require(__dirname + '/../models/bridge');
const superAgent = require('superagent');
const jwtAuth = require(__dirname + '/../lib/jwt_auth');
const bodyParser = require('body-parser').json();

const lightRouter = module.exports = exports = Router();

lightRouter.post('/light', jwtAuth, bodyParser, (req, res) => {
  var newLight = new Light(req.body);
  Bridge.findOne({ admin: req.user._id }, (err, bridge) => {
    if (!bridge) return res.status(401).json({ msg: 'not authorized' });
    if (err) return console.log(err);
    newLight.bridgeId = bridge._id;
  });
  newLight.save((err, data) => {
    if (err) return console.log(err);
    res.status(200).json(data);
  });
});

lightRouter.get('/lights', jwtAuth, (req, res) => {
  var lightObj = {};
  console.log(req.query.on);
  if (req.query.hue) lightObj.hue = parseInt(req.query.hue, 10);
  if (req.query.sat) lightObj.sat = parseInt(req.query.sat, 10);
  if (req.query.bri) lightObj.bri = parseInt(req.query.bri, 10);
  if (req.query.on) lightObj.on = Boolean(req.query.on);
  if (req.query.lightId) lightObj.lightId = req.query.lightId;
  // if (!req.query.hue) console.log('hue not found');

  Bridge.findOne({ admin: req.user._id }, (err, bridge) => {
    if (!bridge) return res.status(401).json({ msg: 'not authorized' });
    if (err) return console.log(err);
    console.log(bridge);
    lightObj.ip = bridge.ip;
    lightObj.bridgeUserId = bridge.bridgeUserId;
    var address = 'http://' + lightObj.ip + '/api/' + lightObj.bridgeUserId +
     '/lights/' + lightObj.lightId + '/state';
     console.log(address);
    superAgent
    .put(address)
    .send({ 'on': lightObj.on, 'sat': lightObj.sat, 'bri': lightObj.bri, 'hue': lightObj.hue })
    // .send({ 'on': false })
    .timeout(1000)
    .end((err, superRes) => {
      if (err && err.timeout) return res.status(408).json({ msg: 'ip address not found' });
      if (err) return console.log(err);
      res.status(200).json(JSON.parse(superRes.text));
    });
  });
});
