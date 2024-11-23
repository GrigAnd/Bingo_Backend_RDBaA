const ObjectId = require('mongodb').ObjectID;

module.exports = {
  method: "POST",
  config: {
    rateLimit: {
      max: 1,
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

      if (request.sign.vk_app_id != process.env.ADMIN_ID) {
        reply
          .code(403)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send();
        return;
      }


      let body = request.body;

      const db = fastify.mongo.db('bingo')
      const bingos = db.collection('bingos');
      const users = db.collection('users');
      const claims = db.collection('claims');

      let claim = await claims.findOne({
        _id: ObjectId(id),
      })

      if (claim == undefined) {
        reply
          .code(404)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send('Not found')
      } else {
        bingos.updateMany(
          {
            $or: [
              {
                "_id": ObjectId(claim.bingo.ref)
              },
              {
                "ref": claim.bingo.ref,
                "edited": false
              }
            ]
          },
          {
            $set: {
              "moderation": body.moderation,
            }
          })
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
              .send(body.moderation);
          })
          .catch((err) => {
          })


        claims.updateMany(
          {
            $or: [
              {
                "_id": ObjectId(id),
              },
              {
                "bingo.ref": claim.bingo.ref,
              }
            ]
          },
          {
            $set: {
              status: body.moderation == 0 ? 2 : 1,
              "moderator": +request.sign.vk_user_id,
            }
          })
          .then((result) => {
          })




        let cls_curs = await claims.find({
          "bingo.ref": claim.bingo.ref,
        })


        await cls_curs.forEach(function (cl) {
          users.updateOne(
            {
              "id": cl.author
            },
            {
              $inc: {
                "claim_rating": body.moderation == 0 ? -1 : 1
              }
            })
            .then((result) => {
            }).catch((err) => {
            })
        })


        users.updateOne(
          {
            "id": claim?.bingo?.ref_creator
          },
          {
            $inc: {
              "rating": body.moderation == -2 ? -10 : body.moderation
            }
          })
          .then((result) => {
          }).catch((err) => {
          })


      }
    }
    catch (error) {
      console.error(error);
      reply
        .code(418)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(error);
    }
  }
}