const sign = require("../../../module/sign");
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;

function isValidBody(obj) {
  if (
    obj.isChecked == undefined ||
    obj.isChecked < 0 ||
    obj.isChecked > 2 ** 25) {
    return false
  }

  return true
}

module.exports = {
  method: "POST",
  config: {
    rateLimit: {
      max: 20,
      timeWindow: 1000
    }
  },
  async execute(fastify, request, reply) {
    try {
      let id = request.params?.id;

      if (request.sign.vk_user_id == undefined) {
        reply
          .code(403)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send();
        return
      }

      let obj = request.body;

      if (!isValidBody(obj)) {
        reply
          .code(400)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send([obj]);
        return
      }

      const db = fastify.mongo.db('bingo')
      const bingos = db.collection('bingos');
      const users = db.collection('users');
      bingos.updateOne(
        {
          "_id": ObjectId(id),
          creator: +request.sign.vk_user_id
        },
        { $set: { "isChecked": obj.isChecked } })
        .then((result) => {
          if (result.result.n !== 1) {
            reply
              .code(404)
              .header('Content-Type', 'application/json; charset=utf-8')
              .send("Not Found");
          }
          reply
            .code(200)
            .header('Content-Type', 'application/json; charset=utf-8')
            .send();
        })
    }
    catch (error) {
      reply
        .code(418)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(error);
    }
  }
}