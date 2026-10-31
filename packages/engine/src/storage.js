// Keeping small things between visits, like a high score, in the browser's
// localStorage.
//
// localStorage can be missing or refuse (a private window, blocked site data,
// running in Node), and then it throws. A lost high score is no reason to
// crash the game, so reading gives null and writing does nothing instead.
export const browserStorage = {
  read(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  write(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Not kept this time; the game goes on without it.
    }
  },
};
