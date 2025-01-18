const { getClaims, findBingoById, findUserById } = require('../../../db/admin')

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
      if (request.sign.vk_user_id == undefined) {
        reply.code(403).header('Content-Type', 'application/json; charset=utf-8').send()
        return
      }

      if (request.sign.vk_app_id != process.env.ADMIN_ID) {
        reply.code(403).header('Content-Type', 'application/json; charset=utf-8').send()
        return
      }

      const db = fastify.mongo.db('bingo')
      const claims = db.collection('claims')
      const bingos = db.collection('bingos')
      const users = db.collection('users')

      const aggCursor = await getClaims(claims, request.params?.id)
      let claim = []
      for await (const doc of aggCursor) {
        claim.push(doc)
      }

      if (claim.length === 0) {
        reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send('No claims found')
        return
      }

      let bingo_id = claim[0].bingo.ref
      let resp = await findBingoById(bingos, bingo_id)
      let user = await findUserById(users, claim[0].author)

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send({
        bingo: resp,
        claims: claim,
        user: user
      })

    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}