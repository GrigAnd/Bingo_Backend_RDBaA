const sign = require("../../../module/sign")
const { updateBingoLike } = require('../../../db/user')

function isValidBody(obj) {
  return obj.like !== undefined
}

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

      let obj = await JSON.parse(request.body)

      if (!isValidBody(obj)) {
        reply.code(400).header('Content-Type', 'application/json; charset=utf-8').send([obj])
        return
      }

      const client = fastify.pg

      let result = await updateBingoLike(client, id, request.sign.vk_user_id, obj.like)

      if (result.rowCount !== 1) {
        reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send("Not Found")
        return
      }

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result)

    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}