const getClaims = async (client, id) => {
  if (!id) {
    const res = await client.query(
      `SELECT * FROM claims WHERE status <= 0 ORDER BY id DESC LIMIT 1`
    )
    return res.rows
  } else {
    const res = await client.query(
      `SELECT * FROM claims WHERE bingo_ref = $1 ORDER BY id DESC`, [id]
    )
    return res.rows
  }
}

const findBingoById = async (client, id) => {
  const res = await client.query(
    `SELECT * FROM bingos WHERE id = $1`, [id]
  )
  return res.rows[0]
}

const findUserById = async (client, id) => {
  const res = await client.query(
    `SELECT * FROM users WHERE id = $1`, [id]
  )
  return res.rows[0]
}

const updateBingosModeration = async (client, ref, moderation) => {
  await client.query(
    `UPDATE bingos SET moderation = $1 WHERE id = $2 OR (ref = $2 AND edited = false)`, [moderation, ref]
  )
}

const updateClaimsStatus = async (client, id, ref, moderation, moderatorId) => {
  await client.query(
    `UPDATE claims SET status = $1, moderator = $2 WHERE id = $3 OR bingo_ref = $4`,
    [moderation === 0 ? 2 : 1, moderatorId, id, ref]
  )
}

const updateUsersClaimRating = async (client, ref, moderation) => {
  await client.query(
    `UPDATE users SET claim_rating = claim_rating + $1 WHERE id IN (SELECT author FROM claims WHERE bingo_ref = $2)`,
    [moderation === 0 ? -1 : 1, ref]
  )
}

const updateCreatorRating = async (client, creatorId, moderation) => {
  await client.query(
    `UPDATE users SET rating = rating + $1 WHERE id = $2`,
    [moderation === -2 ? -10 : moderation, creatorId]
  )
}

const getPendingClaims = async (client) => {
  const res = await client.query(
    `SELECT *, to_timestamp(id::bigint/1000) AS date FROM claims WHERE status <= 0 ORDER BY id DESC LIMIT 10`
  )
  return res.rows
}

module.exports = {
  getClaims,
  findBingoById,
  findUserById,
  updateBingosModeration,
  updateClaimsStatus,
  updateUsersClaimRating,
  updateCreatorRating,
  getPendingClaims
}