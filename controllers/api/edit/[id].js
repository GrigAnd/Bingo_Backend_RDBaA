const sign = require("../../../module/sign")
const { updateBingo } = require('../../../db/user')

function isValidBody(obj) {
  if (obj.title == undefined ||
      typeof obj.title != "string" ||
      obj.title.length == 0 ||
      obj.title.length > 20 ||
      obj.size == undefined ||
      obj.size > 5 ||
      obj.size < 3 ||
      obj.text == undefined ||
      obj.text.length != obj.size ** 2) {
    return false
  }

  for (let i of obj.text) {
    if (typeof i != "string" || i.length == undefined || i.length > 50) {
      return false
    }
  }

  return true
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

      let obj = request.body

      if (!isValidBody(obj)) {
        reply.code(400).header('Content-Type', 'application/json; charset=utf-8').send([
          obj.title == undefined,
          obj.title.length == 0,
          obj.title.length > 20,
          obj.size == undefined,
          obj.size > 5,
          obj.size < 3,
          obj.text == undefined,
          obj.text.length != obj.size ** 2
        ])
        return
      }

      const client = fastify.pg

      let result = await updateBingo(client, id, request.sign.vk_user_id, obj)

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