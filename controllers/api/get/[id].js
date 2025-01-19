const sign = require("../../../module/sign")
const { findBingoWithAccess } = require('../../../db/user')

module.exports = {
  method: "GET",
  config: {
    rateLimit: {
      max: 10,
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

      const client = fastify.pg

      let result = await findBingoWithAccess(client, id, request.sign.vk_user_id)

      if (!result) {
        reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send('Not found')
        return
      }

      result.isLiked = result.likes && result.likes.includes(+request.sign.vk_user_id)
      result.likes = result.likes ? result.likes.length : 0

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result)

    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}