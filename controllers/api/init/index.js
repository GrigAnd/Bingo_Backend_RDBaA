const sign = require("../../../module/sign");

module.exports = {
  method: "GET",
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

      const db = fastify.mongo.db('bingo')
      const users = db.collection('users');
      const bingos = db.collection('bingos');
      users.findOne({
        id: +request.sign.vk_user_id
      }).then((result) => {

        if (result == null) {
          users.insertOne({
            id: +request.sign.vk_user_id
          }).then((result) => {
            reply
              .code(201)
              .header('Content-Type', 'application/json; charset=utf-8')
              .send([]);
          })


        } else {
          bingos.find({
            creator: +request.sign.vk_user_id,
            status: 0,
            moderation: { $not: { $lt: -1 } },
          }).sort({ created: -1 }).toArray(function (err, result) {
            if (result.length === 0) {
              reply
                .code(200)
                .header('Content-Type', 'application/json; charset=utf-8')
                .send([])
            }

            result = result.map((res) => {
              res = { ...res, isLiked: res.likes && res.likes.includes(+request.sign.vk_user_id) }
              res.likes = res.likes.length
              return res
            })


            reply
              .code(200)
              .header('Content-Type', 'application/json; charset=utf-8')
              .send(result)
          })
        }
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