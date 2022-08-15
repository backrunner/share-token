import levelup from 'levelup';
import leveljs from 'level-js';

interface LevelError extends Error {
  notFound: boolean;
}

export const getDbInstance = (dbName?: string) => {
  const idb = levelup(leveljs(dbName || `share-token__${encodeURIComponent(window.location.origin)}`));
  return {
    async get(key: string) {
      try {
        const res = await idb.get(key, {
          asBuffer: false,
        });
        return JSON.parse(res);
      } catch (err) {
        if ((err as LevelError).notFound) {
          return null;
        }
        throw err;
      }
    },
    async set(key: string, value: unknown) {
      await idb.put(key, JSON.stringify(value));
    },
  };
};
