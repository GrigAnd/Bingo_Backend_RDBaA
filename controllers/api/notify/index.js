const sign = require("../../../module/sign");

function isValidBody(obj) {
  if (obj.isAllowed == undefined) {
    return false
  }

  return true
}

module.exports = {
  method: "POST",
  config: {
    rateLimit: {
      max: 10,
      timeWindow: 1000
    }
  },
  async execute(fastify, request, reply) {
    try {
      if (request.sign.vk_user_id == undefined) {
        reply
          .code(403)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send();
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
      const users = db.collection('users');


      users.updateOne({
        id: +request.sign.vk_user_id
      },
      { $set: { "notify": obj.isAllowed } }).then((result) => {
        reply
          .code(201)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send([]);
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