const sign = require("../../../module/sign")
const { updateBingoIsChecked } = require('../../../db/user')

function isValidBody(obj) {
  return obj.isChecked !== undefined && obj.isChecked >= 0 && obj.isChecked <= 2 ** 25
}

module.exports = {
  method: "POST",
  config: {
    rateLimit: {
      max: 20,
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

      let obj = request.body

      if (!isValidBody(obj)) {
        reply.code(400).header('Content-Type', 'application/json; charset=utf-8').send([obj])
        return
      }

      const client = fastify.pg

      let result = await updateBingoIsChecked(client, id, request.sign.vk_user_id, obj.isChecked)

      if (result.rowCount !== 1) {
        reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send("Not Found")
        return
      }

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send()

    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}