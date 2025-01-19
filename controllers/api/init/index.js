const sign = require("../../../module/sign")
const { checkOrCreateUser, getUserBingos } = require('../../../db/user')

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
      if (request.sign.vk_user_id == undefined) {
        reply.code(403).header('Content-Type', 'application/json; charset=utf-8').send()
        return
      }

      const client = fastify.pg

      const user = await checkOrCreateUser(client, request.sign.vk_user_id)

      if (!user) {
        reply.code(201).header('Content-Type', 'application/json; charset=utf-8').send([])
        return
      }

      const result = await getUserBingos(client, request.sign.vk_user_id)

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result)
    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}
