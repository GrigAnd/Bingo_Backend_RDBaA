const sign = require("../../../module/sign")
const { findBingoById, cloneBingo } = require('../../../db/user')
const getUser = require('../../../module/getUser')

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
      let id = request.params?.id

      if (request.sign.vk_user_id == undefined) {
        reply.code(403).header('Content-Type', 'application/json; charset=utf-8').send()
        return
      }

      const db = fastify.mongo.db('bingo')
      const bingos = db.collection('bingos')

      let sourceBingo = await findBingoById(bingos, id)
      if (!sourceBingo) {
        reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send([])
        return
      }

      let author = await getUser(request.sign.vk_user_id)
      let result = await cloneBingo(bingos, request.sign.vk_user_id, sourceBingo, author)

      reply.code(201).header('Content-Type', 'application/json; charset=utf-8').send(result?.insertedId)

    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}
