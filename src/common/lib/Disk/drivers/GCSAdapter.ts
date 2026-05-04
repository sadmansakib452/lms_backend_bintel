import { Storage, Bucket } from '@google-cloud/storage';
import { IStorage } from './iStorage';
import { DiskOption } from '../Option';

export class GCSAdapter implements IStorage {
  private _config: DiskOption;
  private storage: Storage;
  private bucket: Bucket;

  constructor(config: DiskOption) {
    this._config = config;
    this.storage = new Storage({
      projectId: this._config.connection.gcpProjectId,
      keyFilename: this._config.connection.gcpKeyFile, // path to your service account json key file
      apiEndpoint: this._config.connection.gcpApiEndpoint, // optional, for custom endpoints
    });

    this.bucket = this.storage.bucket(this._config.connection.gcpBucket);
  }

  /**
   * Returns the public URL of the object.
   * @param key
   */
  url(key: string): string {
    if (this._config.connection.gcpApiEndpoint) {
      // If using custom endpoint or emulator
      return `${this._config.connection.gcpApiEndpoint}/${this._config.connection.gcpBucket}/${key}`;
    }
    return `https://storage.googleapis.com/${this._config.connection.gcpBucket}/${key}`;
  }

  /**
   * Checks if file exists in the bucket.
   * @param key
   */
  async isExists(key: string): Promise<boolean> {
    try {
      const file = this.bucket.file(key);
      const [exists] = await file.exists();
      return exists;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get file as a readable stream.
   * @param key
   */
  async get(key: string) {
    try {
      const file = this.bucket.file(key);
      const exists = await this.isExists(key);
      if (!exists) {
        throw new Error(`File ${key} does not exist`);
      }
      return file.createReadStream();
    } catch (error) {
      throw new Error(`Failed to get object ${key}: ${error}`);
    }
  }

  /**
   * Upload file buffer or string data.
   * @param key
   * @param value
   */
  async put(key: string, value: Buffer | Uint8Array | string): Promise<any> {
    try {
      const file = this.bucket.file(key);

      await file.save(value);

      const [metadata] = await file.getMetadata();

      return metadata;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete file from bucket.
   * @param key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const file = this.bucket.file(key);
      await file.delete();
      return true;
    } catch (error: any) {
      if (error.code === 404) {
        return false;
      }
      throw error;
    }
  }
}
