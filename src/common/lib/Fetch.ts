import axios from 'axios';

const config = {
  headers: {
    'Content-Type': 'application/json',
  },
};

type AdapterOption = 'fetch' | 'axios';

/**
 * Custom fetch class
 */
export class Fetch {
  private static _baseUrl = ``;
  private static _adapter: AdapterOption = 'axios';

  /**
   * Set adapter.
   * e.g. `fetch` or `axios`
   * @param adapter
   */
  static setAdapter(adapter: AdapterOption) {
    this._adapter = adapter;
  }

  /**
   * get request
   * @param url
   * @param header
   * @returns
   */
  static async get(url: string, header?: any): Promise<any> {
    if (this._adapter == 'axios') {
      return await axios.get(`${this._baseUrl}${url}`, header);
    } else {
      const res = await fetch(`${this._baseUrl}${url}`, header);
      return await res.json();
    }
  }

  /**
   * post request
   * @param url
   * @param data
   * @param header
   * @returns
   */
  static async post(url: string, data: any, header?: any): Promise<any> {
    if (this._adapter == 'axios') {
      return await axios.post(`${this._baseUrl}${url}`, data, header);
    } else {
      const res = await fetch(`${this._baseUrl}${url}`, {
        ...header,
        method: 'POST',
        body: data,
      });
      return await res.json();
    }
  }

  /**
   * put request
   * @param url
   * @param data
   * @param header
   * @returns
   */
  static async put(url: string, data: any, header?: any): Promise<any> {
    if (this._adapter == 'axios') {
      return await axios.put(`${this._baseUrl}${url}`, data, header);
    } else {
      const res = await fetch(`${this._baseUrl}${url}`, {
        ...header,
        method: 'PUT',
        body: data,
      });
      return await res.json();
    }
  }

  /**
   * patch request
   * @param url
   * @param data
   * @param header
   * @returns
   */
  static async patch(url: string, data: any, header?: any): Promise<any> {
    if (this._adapter == 'axios') {
      return await axios.patch(`${this._baseUrl}${url}`, data, header);
    } else {
      const res = await fetch(`${this._baseUrl}${url}`, {
        ...header,
        method: 'PATCH',
        body: data,
      });
      return await res.json();
    }
  }

  /**
   * delete request
   * @param url
   * @param header
   * @returns
   */
  static async delete(url: string, header?: any): Promise<any> {
    if (this._adapter == 'axios') {
      return await axios.delete(`${this._baseUrl}${url}`, header);
    } else {
      const res = await fetch(`${this._baseUrl}${url}`, {
        ...header,
        method: 'DELETE',
      });
      return await res.json();
    }
  }
}
