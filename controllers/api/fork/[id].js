const sign = require("../../../module/sign");
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectID;

const getUser = require('../../../module/getUser');
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

      const db = fastify.mongo.db('bingo')
      const bingos = db.collection('bingos');


      result = await bingos.findOne({
        _id: ObjectId(id),
        privacy: { $lte: 1 },
        status: 0
      })
      if (result.length === 0) {
        reply
          .code(404)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send([])
      }
      let author = await getUser(request.sign.vk_user_id)
      bingos.insertOne({
        creator: +request.sign.vk_user_id,
        isChecked: 0,
        status: 0,
        cr_name: author.name,
        cr_ava: author.ava,
        ref: request.params?.id,
        ref_creator: result.ref_creator ?? result.creator,
        text: result.text,
        size: result.size,
        privacy: result.privacy,
        title: result.title,
        likes: [],
        edited: false,
        created: Number(new Date())
      }).then((result) => {
        reply
          .code(201)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send(result?.insertedId);
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