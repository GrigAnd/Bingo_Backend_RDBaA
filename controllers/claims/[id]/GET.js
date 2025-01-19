const { getClaims, findBingoById, findUserById } = require('../../../db/admin')

module.exports = {
  method: "GET",
  url: "/claims/:id/",
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

      const client = fastify.pg
      const claims = await getClaims(client, request.params?.id)

      if (claims.length === 0) {
        reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send('No claims found')
        return
      }

      let bingo_id = claims[0].bingo_ref
      let resp = await findBingoById(client, bingo_id)
      let user = await findUserById(client, claims[0].author)

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send({
        bingo: resp,
        claims: claims,
        user: user
      })

    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}