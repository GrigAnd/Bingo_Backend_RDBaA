const { getPendingClaims } = require('../../db/admin')

module.exports = {
  method: "GET",
  url: "/claims/",
  config: {
    rateLimit: {
      max: 1,
      timeWindow: 1000
    }
  },
  async execute(fastify, request, reply) {
    try {
      if (request.sign.vk_user_id == undefined) {
        reply
          .code(403)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send();
        return;
      }

      if (request.sign.vk_app_id != process.env.ADMIN_ID) {
        reply
          .code(403)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send();
        return;
      }

      const client = fastify.pg
      const result = await getPendingClaims(client)

      reply
        .code(200)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(result)

    } catch (error) {
      reply
        .code(418)
        .header('Content-Type', 'application/json; charset=utf-8')
        .send(error);
    }
  }
}