const sign = require("../../../module/sign");

module.exports = {
  method: "GET",
  config: {
    rateLimit: {
      max: 1,
      timeWindow: 5000
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

      const aggCursor = await bingos.aggregate([
        {
          $match: {
            privacy: { $lte: 0 },
            status: 0,
            moderation: { $not: { $lt: 0 } },
            nonpop: undefined,
            ref: undefined
          }
        },
        {
          $project: {
            privacy: 0,
            status: 0,
            moderation: 0
          }
        },
        {
          $addFields: {
            isLiked: {
              $in: [+request.sign.vk_user_id, "$likes"]
            },
            likes: {
              $size: "$likes"
            }
          }
        },
        {
          $sort: {
            created: -1
          }
        },
        {
          $limit: 100
        }
      ])

      let result = []
      for await (const doc of aggCursor) {
        result.push(doc)
      }

      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(result)

    }

    catch (error) {
      reply
        .code(418)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(error);
    }
  }
}