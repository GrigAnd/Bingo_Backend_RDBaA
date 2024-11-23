const sign = require("../../../module/sign");

module.exports = {
  method: "GET",
  config: {
    rateLimit: {
      max: 1,
      timeWindow: 10000
    }
  },
  async execute(fastify, request, reply) {
    try {
      let id = request.params?.id;

      if (sign(request.headers?.xvk) == undefined) {
        reply
          .code(403)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send();
        return
      }

      const db = fastify.mongo.db('bingo')
      const bingos = db.collection('bingos')

      bingos.find({
        creator: +id,
        privacy: { $lte: 0 },
        status: { $lte: 0 },
        moderation: { $not: { $lt: -1 } }
      }).toArray(function (err, result) {
        if (result.length === 0) {
          reply
            .code(404)
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
      }
      )
    }
    catch (error) {
      reply
        .code(418)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send();
    }
  }
}