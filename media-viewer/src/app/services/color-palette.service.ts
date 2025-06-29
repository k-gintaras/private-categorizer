import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { ColorPalette, ParsedColorPalette } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ColorPaletteService {
  private colorPalettesCache = new BehaviorSubject<ParsedColorPalette[]>([]);

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {}

  /**
   * Fetch all color palettes from the server, parse them, and update cache.
   */
  fetchColorPalettes(): Observable<ParsedColorPalette[]> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/colors`;
    return this.http.get<ColorPalette[]>(apiUrl).pipe(
      map((palettes) =>
        palettes.map((p) => ({
          ...p,
          colors: p.colors,
        }))
      ),
      tap((parsedPalettes) => this.colorPalettesCache.next(parsedPalettes)),
      catchError((error) => {
        console.error('Error fetching color palettes:', error);
        return of([]);
      })
    );
  }

  /**
   * Get cached color palettes as observable.
   */
  getColorPalettes(): Observable<ParsedColorPalette[]> {
    return this.colorPalettesCache.asObservable();
  }

  /**
   * Add a new color palette and update the cache.
   */
  addColorPalette(
    name: string,
    colors: string[]
  ): Observable<ParsedColorPalette> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/colors`;
    const newPalette = { name, color_palette: JSON.stringify(colors) };

    return this.http.post<ColorPalette>(apiUrl, newPalette).pipe(
      map((p) => ({
        ...p,
        colors: p.colors,
      })),
      tap((palette) => {
        const current = this.colorPalettesCache.value;
        this.colorPalettesCache.next([...current, palette]);
      }),
      catchError((error) => {
        console.error('Error adding color palette:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a color palette by ID and update cache.
   */
  deleteColorPalette(id: number): Observable<void> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/colors/${id}`;
    return this.http.delete<void>(apiUrl).pipe(
      tap(() => {
        const updated = this.colorPalettesCache.value.filter(
          (p) => p.id !== id
        );
        this.colorPalettesCache.next(updated);
      }),
      catchError((error) => {
        console.error('Error deleting color palette:', error);
        throw error;
      })
    );
  }

  fetchColorPaletteById(id: number): Observable<ParsedColorPalette | null> {
    const apiUrl = `${this.apiConfig.getApiBaseUrl()}/colors/${id}`;
    return this.http.get<ColorPalette>(apiUrl).pipe(
      map((dbPalette) => {
        if (!dbPalette) return null;
        let colors: string[] = [];
        try {
          colors = dbPalette.colors;
        } catch (e) {
          console.error(
            `Failed to parse color_palette JSON for palette ID ${id}`,
            e
          );
        }

        return {
          ...dbPalette,
          colors,
        } as ParsedColorPalette;
      }),
      catchError((error) => {
        console.error('Error fetching color palette by ID:', error);
        return of(null);
      })
    );
  }
}
