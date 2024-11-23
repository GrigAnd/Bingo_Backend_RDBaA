module.exports = {
  method: "GET",
  config: {
    rateLimit: {
      max: 1,
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
        return;
      }

      if (request.sign.vk_app_id != process.env.ADMIN_ID) {
        reply
          .code(403)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send();
        return;
      }

      const db = fastify.mongo.db('bingo')
      const claims = db.collection('claims');

      const aggCursor = await claims.aggregate([
        {
          $match: {
            status: { $not: { $gt: 0 } }
          }
        },
        {
          $addFields: {
            date: { $toDate: "$_id" }
          }
        },
        {
          $sort: {
            _id: -1
          }
        },
        {
          $limit: 10
        }
      ])

      let result = []
      for await (const doc of aggCursor) {
        console.log(doc);
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