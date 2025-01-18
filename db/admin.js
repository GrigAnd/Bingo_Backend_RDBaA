const { ObjectId } = require('mongodb')

const findClaimById = async (claims, id) => {
  return await claims.findOne({ _id: ObjectId(id) })
}

const updateBingosModeration = async (bingos, ref, moderation) => {
  return await bingos.updateMany(
    {
      $or: [
        { "_id": ObjectId(ref) },
        { "ref": ref, "edited": false }
      ]
    },
    { $set: { moderation } }
  )
}

const updateClaimsStatus = async (claims, id, ref, moderation, moderatorId) => {
  return await claims.updateMany(
    {
      $or: [
        { "_id": ObjectId(id) },
        { "bingo.ref": ref }
      ]
    },
    {
      $set: {
        status: moderation == 0 ? 2 : 1,
        moderator: +moderatorId
      }
    }
  )
}

const updateUsersClaimRating = async (claims, users, ref, moderation) => {
  const cls_curs = await claims.find({ "bingo.ref": ref })
  for await (const cl of cls_curs) {
    await users.updateOne(
      { id: cl.author },
      { $inc: { claim_rating: moderation == 0 ? -1 : 1 } }
    )
  }
}

const updateCreatorRating = async (users, creatorId, moderation) => {
  await users.updateOne(
    { id: creatorId },
    { $inc: { rating: moderation == -2 ? -10 : moderation } }
  )
}

const getPendingClaims = async (db) => {
  const claims = db.collection('claims')
  const aggCursor = await claims.aggregate([
    {
      $match: {
        status: { $not: { $gt: 0 } }
      }
    },
    {
      $addFields: {
        date: { $toDate: "$_id" }
      }
    },
    {
      $sort: {
        _id: -1
      }
    },
    {
      $limit: 10
    }
  ])

  let result = []
  for await (const doc of aggCursor) {
    result.push(doc)
  }

  return result
}

const getClaims = async (claims, id) => {
  if (!id || id.length === 0) {
    return claims.aggregate([
      { $match: { status: { $not: { $gt: 0 } } } },
      { $addFields: { date: { $toDate: "$_id" } } },
      { $sort: { _id: -1 } },
      { $limit: 1 }
    ])
  } else {
    return claims.aggregate([
      { $match: { "bingo.ref": id } },
      { $addFields: { date: { $toDate: "_id" } } },
      { $sort: { _id: -1 } }
    ])
  }
}

const findBingoById = async (bingos, id) => {
  return await bingos.findOne({ _id: ObjectId(id) })
}

const findUserById = async (users, id) => {
  return await users.findOne({ id })
}

module.exports = {
  getClaims,
  findBingoById,
  findUserById,
  findClaimById,
  updateBingosModeration,
  updateClaimsStatus,
  updateUsersClaimRating,
  updateCreatorRating,
  getPendingClaims
}