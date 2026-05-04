import { StorageClass } from './StorageClass';
import { LocalAdapter } from './drivers/LocalAdapter';
import { DiskOption, DiskType } from './Option';
import { S3Adapter } from './drivers/S3Adapter';
import { IStorage } from './drivers/iStorage';

/**
 * SojebStorage for handling storage (local storage, aws s3 storage)
 * @class SojebStorage
 * @author Sojeb Sikder <sojebsikder@gmail.com>
 */
export class SojebStorage {
  private static _config: DiskOption;

  /**
   * Storage configuration
   * @param config
   */
  public static config(config: DiskOption) {
    this._config = config;
  }

  /**
   * Returns configuration
   * @returns {DiskOption}
   */
  public static getConfig(): DiskOption {
    return this._config;
  }

  /**
   * Specify disk name
   * @param disk
   * @returns
   */
  public static disk(disk: DiskType): StorageClass {
    this._config.driver = disk;
    return this.storageDisk();
  }
  /**
   * store data
   * @param key
   * @param value
   * @returns
   */
  public static async put(key: string, value: any): Promise<any> {
    const disk = this.storageDisk();
    return await disk.put(key, value);
  }

  /**
   * get data url
   * @param key
   * @returns
   */
  public static url(key: string): string {
    const disk = this.storageDisk();
    return disk.url(key);
  }

  public static async isExists(key: string): Promise<boolean> {
    const disk = this.storageDisk();
    return await disk.isExists(key);
  }

  /**
   * read data
   * @param key
   * @returns
   */
  public static async get(key: string): Promise<any> {
    const disk = this.storageDisk();
    return await disk.get(key);
  }

  /**
   * delete data
   * @param key
   * @returns
   */
  public static async delete(key: string): Promise<any> {
    const disk = this.storageDisk();
    if (await disk.isExists(key)) {
      return await disk.delete(key);
    }
    return false;
  }

  /**
   * process storage disk type
   * @returns
   */
  private static storageDisk() {
    const driver: string = this._config.driver;
    const config: DiskOption = this._config;

    let driverAdapter: IStorage;
    switch (driver) {
      // for local filesystem
      case 'local':
        driverAdapter = new LocalAdapter(config);
        break;

      case 's3':
        driverAdapter = new S3Adapter(config);
        break;

      default:
        driverAdapter = new LocalAdapter(config);
        break;
    }
    return new StorageClass(driverAdapter);
  }
}
