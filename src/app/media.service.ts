import { Injectable } from '@angular/core';
import User from './models/User';
import { HttpClient, HttpParams } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { HttpErrorHandler, HandleError } from './http-error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  apiUrl = 'http://functions.theorangealliance.org/addMediaToPending';
  private handleError: HandleError;

  constructor(
    private http: HttpClient,
    httpErrorHandler: HttpErrorHandler) {
      this.handleError = httpErrorHandler.createHandleError('HeroesService');
    }
  
  /**
   * Used to dynamically create the header in order to make a request to the api
   * @param user The current user logged in. The api key is needed to make the request
   */
  private httpHeaders(user: User): HttpHeaders {
    return new HttpHeaders ({
        'Content-Type': 'application/json',
        'X-TOA-Key': user.apiKey,
        'X-Application-Origin': 'the-orange-alliance'
    });
  }

  /**
   * Adds data to firebase. Can be links to youtube, imgur, or grabCAD
   * @param user Needed to get the api key
   * @param media 
   */
  addTeamMedia(user: User, media: any): Observable<any> {
    const httpOptions = {
      headers: this.httpHeaders(user)
    }

    return this.http.post(this.apiUrl, media, httpOptions)
      .pipe(
        catchError(this.handleError('addHero', media))
      );


  }
}
