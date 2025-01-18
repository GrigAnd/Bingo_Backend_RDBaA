const sign = require("../../../module/sign")
const { getPublicBingos } = require('../../../db/user')

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
        reply.code(403).header('Content-Type', 'application/json; charset=utf-8').send()
        return
      }

      const db = fastify.mongo.db('bingo')
      const bingos = db.collection('bingos')

      const aggCursor = await getPublicBingos(bingos, request.sign.vk_user_id)

      let result = []
      for await (const doc of aggCursor) {
        result.push(doc)
      }

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result)

    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}