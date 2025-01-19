const {
  findClaimById,
  updateBingosModeration,
  updateClaimsStatus,
  updateUsersClaimRating,
  updateCreatorRating
} = require('../../../db/admin')

module.exports = {
  method: "POST",
  url: "/claims/:id/",
  config: {
    rateLimit: {
      max: 1,
      timeWindow: 1000
    }
  },
  async execute(fastify, request, reply) {
    try {
      let id = request.params?.id;

      if (request.sign.vk_user_id == undefined) {
        reply
          .code(403)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send();
        return
      }

      if (request.sign.vk_app_id != process.env.ADMIN_ID) {
        reply
          .code(403)
          .header('Content-Type', 'application/json; charset=utf-8')
          .send();
        return;
      }


      let body = request.body;

      const client = fastify.pg

      let claim = await findClaimById(client, id)

      if (!claim) {
        reply.code(404).header('Content-Type', 'application/json; charset=utf-8').send('Not found')
        return
      }

      await updateBingosModeration(client, claim.bingo_ref, body.moderation)
      await updateClaimsStatus(client, id, claim.bingo_ref, body.moderation, request.sign.vk_user_id)
      await updateUsersClaimRating(client, claim.bingo_ref, body.moderation)
      await updateCreatorRating(client, claim.bingo_ref_creator, body.moderation)

      reply.code(200).header('Content-Type', 'application/json; charset=utf-8').send(body.moderation)

    } catch (error) {
      console.error(error)
      reply.code(418).header('Content-Type', 'application/json; charset=utf-8').send(error)
    }
  }
}