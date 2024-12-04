import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { ColorPalette } from '../models/color.model';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root',
})
export class ColorPaletteService {
  private colorPalettesCache: BehaviorSubject<ColorPalette[]> =
    new BehaviorSubject<ColorPalette[]>([]);

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  /**
   * Fetch all color palettes from the server.
   */
  fetchColorPalettes(): Observable<ColorPalette[]> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/colors`;
    return this.http.get<ColorPalette[]>(apiUrl).pipe(
      tap((palettes) => {
        this.colorPalettesCache.next(palettes); // Update the cache
      }),
      catchError((error) => {
        console.error('Error fetching color palettes:', error);
        return of([]);
      })
    );
  }

  /**
   * Get cached color palettes.
   */
  getColorPalettes(): Observable<ColorPalette[]> {
    return this.colorPalettesCache.asObservable();
  }

  /**
   * Add a new color palette to the server and update the cache.
   * @param name The name of the palette.
   * @param colors The array of colors in the palette.
   */
  addColorPalette(name: string, colors: string[]): Observable<ColorPalette> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/colors`;
    const newPalette = { name, colorPalette: colors };

    return this.http.post<ColorPalette>(apiUrl, newPalette).pipe(
      tap((palette) => {
        // Update the cache with the new palette
        const currentPalettes = this.colorPalettesCache.value;
        this.colorPalettesCache.next([...currentPalettes, palette]);
      }),
      catchError((error) => {
        console.error('Error adding color palette:', error);
        throw error;
      })
    );
  }

  /**
   * Remove a color palette from the server and update the cache.
   * @param id The ID of the palette to remove.
   */
  deleteColorPalette(id: number): Observable<void> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/colors/${id}`;
    return this.http.delete<void>(apiUrl).pipe(
      tap(() => {
        // Remove the palette from the cache
        const updatedPalettes = this.colorPalettesCache.value.filter(
          (palette) => palette.id !== id
        );
        this.colorPalettesCache.next(updatedPalettes);
      }),
      catchError((error) => {
        console.error('Error deleting color palette:', error);
        throw error;
      })
    );
  }

  /**
   * Fetch a specific color palette by ID from the server.
   * @param id The ID of the palette to fetch.
   */
  fetchColorPaletteById(id: number): Observable<ColorPalette | null> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/colors/${id}`;
    return this.http.get<ColorPalette>(apiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching color palette by ID:', error);
        return of(null);
      })
    );
  }
}
