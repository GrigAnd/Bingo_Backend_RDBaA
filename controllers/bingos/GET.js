const sign = require("../../module/sign")
const { getPublicBingos, getPopularBingos } = require('../../db/user')

module.exports = {
  method: "GET",
  url: "/bingos/",
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

      const client = fastify.pg
      const timeParam = request.query.time
      let time = Number(new Date())
      let result

      if (timeParam === 'new' || !timeParam) {
        result = await getPublicBingos(client, request.sign.vk_user_id)
      } else {
        switch (timeParam) {
          case 'day':
            time -= 86400000
            break
          case 'week':
            time -= 604800000
            break
          case 'month':
            time -= 2592000000
            break
          default:
            const customTime = parseInt(timeParam)
            if (!isNaN(customTime)) {
              time -= customTime
            } else {
              time = 0
            }
        }
        result = await getPopularBingos(client, request.sign.vk_user_id, time)
      }

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(result)

    } catch (error) {
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}
