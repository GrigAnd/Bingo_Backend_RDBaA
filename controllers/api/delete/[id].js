const sign = require("../../../module/sign")
const { updateBingoStatus } = require('../../../db/user')

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
      let id = request.params?.id
      if (sign(request.headers?.xvk) == undefined) {
        reply.code(403).header('Content-Type', 'application/json; charset=utf-8').send()
        return
      }

      const db = fastify.mongo.db('bingo')
      const bingos = db.collection('bingos')

      let result = await updateBingoStatus(bingos, id, request.sign.vk_user_id)

      if (result.modifiedCount !== 1) {
        reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send("Not Found")
        return
      }

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send()

    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}
