const { findBingoForClaim, insertClaim } = require('../../../db/user')
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

      let obj = request.body
      const db = fastify.mongo.db('bingo')
      const bingos = db.collection('bingos')
      const claims = db.collection('claims')

      let result = await findBingoForClaim(bingos, id)
      if (!result) {
        reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send([])
        return
      }

      let author = await getUser(request.sign.vk_user_id)
      await insertClaim(claims, request.sign.vk_user_id, obj, result, author)

      reply.code(201).header('Content-Type', 'application/json; charset=utf-8').send()

    } catch (error) {
      console.log(error)
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}
