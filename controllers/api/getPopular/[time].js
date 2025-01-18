const sign = require("../../../module/sign")
const { getPopularBingos } = require('../../../db/user')

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
      let time = Number(new Date())
      switch (request.params?.time) {
        case 'day':
          time -= 86400000
          break
        case 'week':
          time -= 604800000
          break
        case 'month':
          time -= 2592000000
          break
        default:
          time = 0
      }

      if (request.sign.vk_user_id == undefined) {
        reply.code(403).header('Content-Type', 'application/json; charset=utf-8').send()
        return
      }

      const db = fastify.mongo.db('bingo')
      const bingos = db.collection('bingos')

      const aggCursor = await getPopularBingos(bingos, request.sign.vk_user_id, time)

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
