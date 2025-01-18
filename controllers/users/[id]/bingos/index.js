const sign = require("../../../../module/sign")
const { fetchUserBingos } = require("../../../../db/user")

module.exports = {
  method: "GET",
  config: {
    rateLimit: {
      max: 1,
      timeWindow: 10000
    }
  },
  async execute(fastify, request, reply) {
    try {
      let id = request.params?.id

      if (sign(request.headers?.xvk) == undefined) {
        reply.code(403).header('Content-Type', 'application/json; charset=utf-8').send()
        return
      }

      const result = await fetchUserBingos(fastify.pg, id, request.sign.vk_user_id)

      if (result.length === 0) {
        reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send([])
        return
      }

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result)
    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send()
    }
  }
}