const { ObjectId } = require('mongodb')

const findBingoForClaim = async (bingos, id) => {
  return await bingos.findOne({
    _id: ObjectId(id),
    privacy: { $lte: 1 },
    status: 0
  })
}

const insertClaim = async (claims, userId, obj, bingoData, author) => {
  return await claims.insertOne({
    author: +userId,
    reason: obj?.reason,
    comment: obj?.comment,
    bingo: {
      isChecked: 0,
      status: 0,
      cr_name: author.name,
      cr_ava: author.ava,
      ref: bingoData._id,
      ref_creator: bingoData.ref_creator ?? bingoData.creator,
      text: bingoData.text,
      size: bingoData.size,
      privacy: bingoData.privacy,
      title: bingoData.title,
      likes: [],
      edited: false
    }
  })
}

const insertBingo = async (bingos, userId, author, obj) => {
  return await bingos.insertOne({
    creator: +userId,
    cr_name: author.name,
    cr_ava: author.ava,
    privacy: obj.privacy,
    status: 0,
    title: obj.title,
    size: obj.size,
    text: obj.text,
    isChecked: 0,
    likes: [],
    created: Number(new Date())
  })
}

const updateBingoStatus = async (bingos, id, userId) => {
  return await bingos.updateOne(
    {
      _id: ObjectId(id),
      creator: +userId,
      status: 0
    },
    { $set: { status: 1 } }
  )
}

const updateBingo = async (bingos, id, userId, obj) => {
  return await bingos.updateOne(
    {
      _id: ObjectId(id),
      creator: +userId
    },
    {
      $set: {
        privacy: obj.privacy,
        title: obj.title,
        text: obj.text,
        size: obj.size
      }
    }
  )
}

const findBingoById = async (bingos, id) => {
  return await bingos.findOne({
    _id: ObjectId(id),
    privacy: { $lte: 1 },
    status: 0
  })
}

const cloneBingo = async (bingos, userId, sourceBingo, author) => {
  return await bingos.insertOne({
    creator: +userId,
    isChecked: 0,
    status: 0,
    cr_name: author.name,
    cr_ava: author.ava,
    ref: sourceBingo._id,
    ref_creator: sourceBingo.ref_creator ?? sourceBingo.creator,
    text: sourceBingo.text,
    size: sourceBingo.size,
    privacy: sourceBingo.privacy,
    title: sourceBingo.title,
    likes: [],
    edited: false,
    created: Number(new Date())
  })
}

const findBingoWithAccess = async (bingos, id, userId) => {
  return await bingos.findOne({
    _id: ObjectId(id),
    status: 0,
    moderation: { $not: { $lt: -1 } },
    $or: [
      { privacy: { $lte: 1 } },
      { creator: +userId }
    ]
  })
}

const getPublicBingos = async (bingos, userId) => {
  return await bingos.aggregate([
    {
      $match: {
        privacy: { $lte: 0 },
        status: 0,
        moderation: { $not: { $lt: 0 } },
        nonpop: undefined,
        ref: undefined
      }
    },
    {
      $project: {
        privacy: 0,
        status: 0,
        moderation: 0
      }
    },
    {
      $addFields: {
        isLiked: { $in: [+userId, "$likes"] },
        likes: { $size: "$likes" }
      }
    },
    {
      $sort: { created: -1 }
    },
    {
      $limit: 100
    }
  ])
}

const getPopularBingos = async (bingos, userId, time) => {
  return await bingos.aggregate([
    {
      $match: {
        privacy: { $lte: 0 },
        status: 0,
        moderation: { $not: { $lt: 0 } },
        created: { $gte: time },
        nonpop: undefined,
        ref: undefined
      }
    },
    {
      $project: {
        privacy: 0,
        status: 0,
        moderation: 0
      }
    },
    {
      $addFields: {
        isLiked: { $in: [+userId, "$likes"] },
        likes: { $size: "$likes" }
      }
    },
    {
      $sort: { likes: -1 }
    },
    {
      $limit: 100
    }
  ])
}

const checkOrCreateUser = async (users, userId) => {
  const user = await users.findOne({ id: +userId })
  if (!user) {
    await users.insertOne({ id: +userId })
    return null
  }
  return user
}

const getUserBingos = async (bingos, userId) => {
  const results = await bingos.find({
    creator: +userId,
    status: 0,
    moderation: { $not: { $lt: -1 } }
  }).sort({ created: -1 }).toArray()

  return results.map(res => {
    return {
      ...res,
      isLiked: res.likes && res.likes.includes(+userId),
      likes: res.likes.length
    }
  })
}

const updateBingoLike = async (bingos, id, userId, like) => {
  return await bingos.updateOne(
    {
      _id: ObjectId(id),
      $or: [{ privacy: { $lte: 1 } }, { creator: +userId }],
      status: 0
    },
    like == 1
      ? { $addToSet: { likes: +userId } }
      : { $pull: { likes: +userId } }
  )
}

const updateUserNotification = async (users, userId, isAllowed) => {
  return await users.updateOne(
    { id: +userId },
    { $set: { notify: isAllowed } }
  )
}

const updateBingoIsChecked = async (bingos, id, userId, isChecked) => {
  return await bingos.updateOne(
    {
      _id: ObjectId(id),
      creator: +userId
    },
    { $set: { isChecked: isChecked } }
  )
}

module.exports = {
  findBingoWithAccess,
  updateBingo,
  findBingoById,
  cloneBingo,
  updateBingoStatus,
  insertBingo,
  findBingoForClaim,
  insertClaim,
  getPublicBingos,
  getPopularBingos,
  checkOrCreateUser,
  getUserBingos,
  updateBingoLike,
  updateUserNotification,
  updateBingoIsChecked
}