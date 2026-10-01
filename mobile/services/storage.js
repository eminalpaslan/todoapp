import * as SecureStore from 'expo-secure-store';

// Token, cihazin sifreli depolama alaninda tutulur (AsyncStorage gibi duz
// metin degil) - cihaz calinirsa/root'lanirsa bile token'a erismek zorlasir.
const TOKEN_KEY = 'access_token';

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function deleteToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
