import { md5, sha1 } from 'hash-wasm';
import { nanoid } from 'nanoid';
import { ShareTokenConfig, ValidateResponse } from './types';
import { getDbInstance } from './utils/db';

export class ShareTokenFactory {
  private config: ShareTokenConfig;
  private db: ReturnType<typeof getDbInstance>;
  private cachedToken?: string;

  public constructor(config?: ShareTokenConfig) {
    this.config = config || {};
    this.db = getDbInstance(config?.dbName);
  }

  public async getToken() {
    if (this.cachedToken) {
      return this.cachedToken;
    }
    let originHash;
    try {
      originHash = await sha1(window.location.origin);
    } catch (err) {
      console.error(err);
    }
    const localStorageKey = originHash || encodeURIComponent(window.location.origin);
    try {
      // use idb firstly
      const token = await this.db.get('__token');
      if (typeof token === 'string') {
        return token;
      }
      const newToken = nanoid();
      await this.db.set('__token', newToken);
      window.localStorage.setItem(`__share_token__${localStorageKey}`, newToken);
      this.cachedToken = newToken;
      return newToken;
    } catch (err) {
      // downgrade to localStorage
      console.error('Failed to retrieve token, using downgraded method.');
      const inLocalStorage = window.localStorage.getItem(localStorageKey);
      if (typeof inLocalStorage === 'string' && inLocalStorage.length === 21) {
        return inLocalStorage;
      }
      // generate new and save to local storage
      const newToken = nanoid();
      window.localStorage.setItem(`__share_token__${localStorageKey}`, newToken);
      this.cachedToken = newToken;
      return newToken;
    }
  }

  public async validateToken(token: string) {
    if (token.length !== 21) {
      return false;
    }
    if (!this.config?.validateEndPoint) {
      throw new Error('Endpoint is not speicified.');
    }
    if (!this.config?.validateEndPoint.startsWith('http')) {
      throw new Error('Invalid endpoint url.');
    }
    if (!window.fetch) {
      throw new Error('Fetch is not supported.');
    }
    // fetch from remote end point
    const res = await fetch(this.config.validateEndPoint, {
      method: 'POST',
      body: JSON.stringify({
        token,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.status !== 200) {
      console.error('Cannot validate the share token due to the invalid response.', res);
      throw new Error('Invalid response.');
    }
    const resObj = (await res.json()) as ValidateResponse;
    if (resObj.code !== 0) {
      console.error('Invalid validating return.', resObj);
      throw new Error('Invalid validating return.');
    }
    return {
      isBlocked: resObj.isBlocked,
    };
  }
}
