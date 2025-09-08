import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_STORAGE_KEYS = {
  rememberMe: 'RememberMe',
  userEmail: 'userEmail',
  userId: 'userId',
  accessToken: 'USER_ACCESS',
  refreshToken: 'USER_REFRESH',
  lastLoginTs: 'lastLoginTimestamp',
  username: 'userName',
  profileImage: 'userImage',
};

export const UserStorage = {
  saveAuth: async ({ userId, token, refreshToken, email, rememberMe }) => {
    await Promise.all([
      AsyncStorage.setItem(USER_STORAGE_KEYS.rememberMe, String(!!rememberMe)),
      email ? AsyncStorage.setItem(USER_STORAGE_KEYS.userEmail, email) : Promise.resolve(),
      userId ? AsyncStorage.setItem(USER_STORAGE_KEYS.userId, String(userId)) : Promise.resolve(),
      refreshToken ? AsyncStorage.setItem(USER_STORAGE_KEYS.refreshToken, String(refreshToken)) : Promise.resolve(),
      token ? AsyncStorage.setItem(USER_STORAGE_KEYS.accessToken, String(token)) : Promise.resolve(),
      AsyncStorage.setItem(USER_STORAGE_KEYS.lastLoginTs, Date.now().toString()),
    ]);
  },

  saveProfileBasics: async ({ username, image }) => {
    await Promise.all([
      username ? AsyncStorage.setItem(USER_STORAGE_KEYS.username, String(username)) : Promise.resolve(),
      image ? AsyncStorage.setItem(USER_STORAGE_KEYS.profileImage, String(image)) : Promise.resolve(),
    ]);
  },

  getAll: async () => {
    const [rememberMe, email, userId, token, refreshToken, lastLoginTimestamp, username, userImage] = await Promise.all([
      AsyncStorage.getItem(USER_STORAGE_KEYS.rememberMe),
      AsyncStorage.getItem(USER_STORAGE_KEYS.userEmail),
      AsyncStorage.getItem(USER_STORAGE_KEYS.userId),
      AsyncStorage.getItem(USER_STORAGE_KEYS.accessToken),
      AsyncStorage.getItem(USER_STORAGE_KEYS.refreshToken),
      AsyncStorage.getItem(USER_STORAGE_KEYS.lastLoginTs),
      AsyncStorage.getItem(USER_STORAGE_KEYS.username),
      AsyncStorage.getItem(USER_STORAGE_KEYS.profileImage),
    ]);
    return {
      rememberMe: rememberMe === 'true',
      email,
      userId,
      token,
      refreshToken,
      lastLoginTimestamp: lastLoginTimestamp ? Number(lastLoginTimestamp) : undefined,
      username,
      userImage,
    };
  },
};


