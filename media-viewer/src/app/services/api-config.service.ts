import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiConfigService {
  private apiBaseUrl: string = environment.apiBaseUrl;

  constructor() {
    console.log('this.apiBaseUrl');
    console.log(this.apiBaseUrl);
  }

  /**
   * Get the API Base URL.
   * @returns The API Base URL.
   */
  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  getApiFilesUrl(): string {
    return `${this.apiBaseUrl}/files`;
  }

  getApiTagsUrl(): string {
    return `${this.apiBaseUrl}/tags`;
  }
}
