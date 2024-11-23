const ObjectId = require('mongodb').ObjectID;

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
      const bingos = db.collection('bingos');
      const users = db.collection('users');


      let aggCursor;
      if (request.params?.id?.length == 0) {
        aggCursor = await claims.aggregate([
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
            $limit: 1
          }
        ])
      } else {
        aggCursor = await claims.aggregate([
          {
            $match: {
              "bingo.ref": request.params.id
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
          }
        ])
      }
      let claim = []
      for await (const doc of aggCursor) {
        console.log(doc);
        claim.push(doc)
      }

      let bingo_id = claim[0].bingo.ref;

      let resp = await bingos.findOne({
        _id: ObjectId(bingo_id)
      })

      let user = await users.findOne({
        id: claim[0].author
      })


      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(
          {
            bingo: resp,
            claims: claim,
            user: user
          }
        )

    }

    catch (error) {
      reply
        .code(418)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(error);
    }
  }
}