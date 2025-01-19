const findBingoForClaim = async (client, id) => {
  const res = await client.query(
    `SELECT * FROM bingos WHERE id = $1 AND privacy <= 1 AND status = 0`, [id]
  )
  return res.rows[0]
}

const insertClaim = async (client, userId, obj, bingoData, author) => {
  const res = await client.query(
    `INSERT INTO claims (author, reason, comment, bingo_ref) 
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [
      userId,
      obj?.reason,
      obj?.comment,
      bingoData.id
    ]
  )
  
  const claimId = res.rows[0].id

  await client.query(
    `INSERT INTO claim_details (claim_id, bingo_ref_creator, bingo_text, bingo_size, bingo_privacy, bingo_title, bingo_likes, bingo_edited) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      claimId,
      bingoData.ref_creator ?? bingoData.creator,
      bingoData.text,
      bingoData.size,
      bingoData.privacy,
      bingoData.title,
      [],
      false
    ]
  )
}

const insertBingo = async (client, userId, author, obj) => {
  const res = await client.query(
    `INSERT INTO bingos (creator, cr_name, cr_ava, privacy, status, title, size, text, is_checked, likes, created)
     VALUES ($1, $2, $3, $4, 0, $5, $6, $7, FALSE, ARRAY[]::INTEGER[], $8) RETURNING id`,
    [
      userId,
      author.name,
      author.ava,
      obj.privacy,
      obj.title,
      obj.size,
      obj.text,
      Date.now()
    ]
  )
  return res.rows[0]
}

const updateBingoStatus = async (client, id, userId) => {
  const res = await client.query(
    `UPDATE bingos SET status = 1 WHERE id = $1 AND creator = $2 AND status = 0`,
    [id, userId]
  )
  return res
}

const updateBingo = async (client, id, userId, obj) => {
  const res = await client.query(
    `UPDATE bingos SET privacy = $1, title = $2, text = $3, size = $4 WHERE id = $5 AND creator = $6`,
    [obj.privacy, obj.title, obj.text, obj.size, id, userId]
  )
  return res
}

const findBingoById = async (client, id) => {
  const res = await client.query(
    `SELECT * FROM bingos WHERE id = $1 AND privacy <= 1 AND status = 0`, [id]
  )
  return res.rows[0]
}

const cloneBingo = async (client, userId, sourceBingo, author) => {
  const res = await client.query(
    `INSERT INTO bingos (creator, is_checked, status, cr_name, cr_ava, ref, ref_creator, text, size, privacy, title, likes, edited, created)
     VALUES ($1, 0, 0, $2, $3, $4, $5, $6, $7, $8, $9, ARRAY[]::INTEGER[], false, $10) RETURNING id`,
    [
      userId,
      author.name,
      author.ava,
      sourceBingo.id,
      sourceBingo.ref_creator ?? sourceBingo.creator,
      sourceBingo.text,
      sourceBingo.size,
      sourceBingo.privacy,
      sourceBingo.title,
      Date.now()
    ]
  )
  return res.rows[0]
}

const updateUserNotification = async (client, userId, isAllowed) => {
  await client.query(
    `UPDATE users SET notify = $1 WHERE id = $2`,
    [isAllowed, userId]
  )
}

const findBingoWithAccess = async (client, id, userId) => {
  const res = await client.query(
    `SELECT *, ($1 = ANY(likes)) AS isLiked, array_length(likes, 1) AS likes FROM bingos WHERE id = $2 AND status = 0 AND (privacy <= 1 OR creator = $1)`,
    [userId, id]
  )
  return res.rows[0]
}

const getPublicBingos = async (client, userId) => {
  const res = await client.query(
    `SELECT *, ($1 = ANY(likes)) AS isLiked, array_length(likes, 1) AS likes
     FROM bingos
     WHERE privacy <= 0 AND status = 0 AND moderation >= 0 AND ref IS NULL AND nonpop IS NULL
     ORDER BY created DESC
     LIMIT 100`,
    [userId]
  )
  return res.rows
}

const getPopularBingos = async (client, userId, time) => {
  const res = await client.query(
    `SELECT *, ($1 = ANY(likes)) AS isLiked, array_length(likes, 1) AS likes
     FROM bingos
     WHERE privacy <= 0 AND status = 0 AND moderation >= 0 AND created >= $2 AND ref IS NULL AND nonpop IS NULL
     ORDER BY array_length(likes, 1) DESC
     LIMIT 100`,
    [userId, time]
  )
  return res.rows
}


const checkOrCreateUser = async (client, userId) => {
  const res = await client.query(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  )
  if (res.rowCount === 0) {
    await client.query(
      `INSERT INTO users (id) VALUES ($1)`,
      [userId]
    )
    return null
  }
  return res.rows[0]
}

const getUserBingos = async (client, userId) => {
  const res = await client.query(
    `SELECT *, ($1 = ANY(likes)) AS isLiked, array_length(likes, 1) AS likes
     FROM bingos
     WHERE creator = $1 AND status = 0 AND moderation >= -1
     ORDER BY created DESC`,
    [userId]
  )
  return res.rows
}

const updateBingoLike = async (client, id, userId, like) => {
  const query = like === 1 ?
    `UPDATE bingos SET likes = array_append(likes, $1) WHERE id = $2 AND (privacy <= 1 OR creator = $1) AND status = 0` :
    `UPDATE bingos SET likes = array_remove(likes, $1) WHERE id = $2 AND (privacy <= 1 OR creator = $1) AND status = 0`

  const res = await client.query(query, [userId, id])
  return res
}

const updateBingoIsChecked = async (client, id, userId, isChecked) => {
  await client.query(
    `UPDATE bingos SET is_checked = $1 WHERE id = $2 AND creator = $3`,
    [isChecked, id, userId]
  )
}

async function fetchUserBingos(client, creatorId, vkUserId) {
  const res = await client.query(
    `SELECT *, ($1 = ANY(likes)) AS isLiked, array_length(likes, 1) AS likes
     FROM bingos
     WHERE creator = $2 AND privacy <= 0 AND status <= 0 AND moderation >= -1`,
    [vkUserId, creatorId]
  )
  return res.rows
}

module.exports = {
  findBingoForClaim,
  insertClaim,
  insertBingo,
  updateBingoStatus,
  updateBingo,
  findBingoById,
  cloneBingo,
  updateBingoLike,
  updateUserNotification,
  findBingoWithAccess,
  getPublicBingos,
  getPopularBingos,
  checkOrCreateUser,
  getUserBingos,
  updateBingoIsChecked,
  fetchUserBingos
}
