const sign = require("../../../module/sign")
const { updateUserNotification } = require('../../../db/user')

function isValidBody(obj) {
  return obj.isAllowed !== undefined
}

module.exports = {
  method: "POST",
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

      let obj = request.body

      if (!isValidBody(obj)) {
        reply.code(400).header('Content-Type', 'application/json; charset=utf-8').send([obj])
        return
      }

      const client = fastify.pg

      await updateUserNotification(client, request.sign.vk_user_id, obj.isAllowed)

      reply.code(201).header('Content-Type', 'application/json; charset=utf-8').send([])

    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}