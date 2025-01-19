const cache = {};

module.exports = async (_id) => {
  if (cache[_id]) {
    return cache[_id]
  }

  try {
    const resp = await fetch(`https://api.vk.com/method/users.get?access_token=${process.env.TOKEN}&v=5.140&fields=photo_100&user_id=${_id}`)
    const data = await resp.json()
    const userData = data?.response?.[0]

    if (userData) {
      const user = {
        name: `${userData.first_name} ${userData.last_name}`,
        ava: userData.photo_100
      }
      cache[_id] = user
      return user
    } else {
      throw new Error('User data not found')
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}