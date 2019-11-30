import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from 'firebase/app';
import TOAUser from '../models/User';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { rejects } from 'assert';

import { HttpErrorHandler, HandleError } from '../http-error-handler.service';
export enum Service {
  Dev = 'Dev',
  Live = 'Live',
  Api = 'Api'
}

@Injectable()
export class CloudFunctions {

  private baseUrl = 'https://functions.theorangealliance.org';
  // private baseUrl = 'http://localhost:5000/the-orange-alliance/us-central1/requireValidations'; // Tests Only
  private handleError: HandleError;

  constructor(
    private http: HttpClient,
    httpErrorHandler: HttpErrorHandler) {
      this.handleError = httpErrorHandler.createHandleError('CloudFunctions');
  }

  public getUserData(user: User, type?: string): Promise<TOAUser> {
    return new Promise<TOAUser>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          ...(type ? {'data': type} : {})
        });

        this.http.get(this.baseUrl + '/user', {headers: headers}).subscribe((data: any) => {
          resolve(new TOAUser().fromJSON(data));
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public getShortUserData(user: User): Promise<TOAUser> {
    return new Promise<TOAUser>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'short': 'true'
        });

        this.http.get(this.baseUrl + '/user', {headers: headers}).subscribe((data: any) => {
          resolve(new TOAUser().fromJSON(data));
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public getUserDataByUID(user: User, uid: string): Promise<TOAUser> {
    return new Promise<TOAUser>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': uid
        });

        this.http.get(this.baseUrl + '/user', {headers: headers}).subscribe((data: any) => {
          resolve(new TOAUser().fromJSON(data));
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public getAllUsers(user: User): Promise<any[]> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`
        });

        this.http.get(this.baseUrl + '/allUsers', {headers: headers}).subscribe((data: any) => {
          resolve(data.map((result: any) => new TOAUser().fromJSON(result)));
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public generateApiKey(user: User): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`
        });

        this.http.get(this.baseUrl + '/generateKey', {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public addToFavorite(user: User, key: string, type: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': type
        });

        this.http.post(this.baseUrl + '/user/addFavorite', key, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public removeFromFavorite(user: User, key: string, type: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': type
        });

        this.http.post(this.baseUrl + '/user/removeFavorite', key, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public generateEventApiKey(user: User, eventKey: string): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': eventKey
        });

        this.http.get(this.baseUrl + '/eventKey', {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public playlistMatchify(user: User, eventKey: string, playlistID: string): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': eventKey
        });

        const body = {
          'playlistID': playlistID
        };

        this.http.post(this.baseUrl + '/playlistMatchify', body, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public manageAdmin(user: User, userToUpdate: string, body: object): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': userToUpdate
        });

        this.http.post(this.baseUrl + '/user/manageAdmin', body, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public setVideos(user: User, eventKey: string, videos: any[]): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': eventKey
        });

        this.http.post(this.baseUrl + '/setVideos', videos, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public createEvent(user: User, eventData: any[]): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`
        });

        this.http.post(this.baseUrl + '/createEvent', eventData, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public updateEvent(user: User, eventKey: string, eventData: any): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': eventKey
        });

        this.http.post(this.baseUrl + '/updateEvent', [eventData], {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public addEventMedia(user: User, mediaData: any): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': 'event'
        });

        this.http.post(this.baseUrl + '/addMedia', mediaData, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public addTeamMedia(user: User, mediaData: any): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': 'team'
        });

        this.http.post(this.baseUrl + '/addMedia', mediaData, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public addMediaToPending(user: User, mediaData: any, stream = false): Promise<any> {
    let dataHeader;
    if (stream) {
      dataHeader = 'stream';
    } else if (mediaData.event_key) {
      dataHeader = 'event';
    } else if (mediaData.team_key) {
      dataHeader = 'team';
    } else {
      return new Promise<any>( ((resolve, reject) => {reject('No Team or Event is Defined! (Or both are defined!)')}))
    }

    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': dataHeader
        });

        this.http.post(this.baseUrl + '/addMediaToPending', mediaData, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public addSuggestion(user: User, suggestionData: any): Promise<any> {
    let dataHeader;
    if (suggestionData.match_key !== undefined && suggestionData.event_key === undefined) {
      dataHeader = 'add_match_video';
    } else if (suggestionData.match_key === undefined && suggestionData.event_key !== undefined) {
      dataHeader = 'add_event_stream';
    } else {
      return new Promise<any>( ((resolve, reject) => {reject('No Suggestion Data is Defined! (Or both types are defined!)')}))
    }

    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': dataHeader
        });

        this.http.post(this.baseUrl + '/user/addSuggestion', suggestionData, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public getAllSuggestions(user: User): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`
        });
        this.http.get(this.baseUrl + '/user/allSuggestions', {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public deleteSuggestion(user: User, suggestionID: any): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': suggestionID
        });
        this.http.delete(this.baseUrl + '/user/deleteSuggestion', {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public addStream(user: User, streamData: any): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`
        });

        this.http.post(this.baseUrl + '/addStream', streamData, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public hideStream(user: User, streamData: any): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`
        });

        this.http.post(this.baseUrl + '/hideStream', streamData, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public dumpCache(user: User, route: string): Promise<any> {
    return this.toaPost(user, '', `/web/dumpCache?route=/api/${route}`);
  }

  public toaPost(user: User, body: any, route: string): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': route
        });

        this.http.post(this.baseUrl + '/toaapi', body, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          if (err.status === 200) {
            resolve(err);
          } else {
            reject(err);
          }
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public toaPut(user: User, body: any, route: string): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': route
        });

        this.http.put(this.baseUrl + '/toaapi', body, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          if (err.status === 200) {
            resolve(err);
          } else {
            reject(err);
          }
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public toaDelete(user: User, route: string): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': route
        });

        this.http.delete(this.baseUrl + '/toaapi', {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          if (err.status === 200) {
            resolve(err);
          } else {
            reject(err);
          }
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public eventsRetriever(user: User, year: number): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': `${year}`
        });

        this.http.get(this.baseUrl + '/firstEvents', {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public teamsRetriever(user: User, year: string): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': `${year}`
        });

        this.http.get(this.baseUrl + '/firstTeams', {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public getEventSettings(user: User, eventKey: string): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': eventKey
        });

        this.http.get(this.baseUrl + '/user/getEventSettings', {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public updateEventSettings(user: User, eventKey: string, settings: any): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': eventKey
        });

        this.http.post(this.baseUrl + '/user/updateEventSettings', settings, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public saveMessagingToken(user: User, messagingToken: string): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`
        });

        this.http.post(this.baseUrl + '/user/saveMessagingToken', messagingToken, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public update(user: User, service: Service): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`
        });

        this.http.get(this.baseUrl + `/update${Service[service]}`, {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public getPm2Data(user: User): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      if (user) {
        this.userToToken(user).then((token) => {
          const headers = new HttpHeaders({
            'authorization': `Bearer ${token}`
          });

          this.http.get(this.baseUrl + `/serverStatus`, {headers: headers}).subscribe((data: any) => {
            resolve(data);
          }, (err: any) => {
            reject(err);
          });
        }).catch((err: any) => {
          reject(err);
        });
      } else {
        reject();
      }
    });
  }

  public getPendingMedia(user: User): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`
        });

        this.http.get(this.baseUrl + '/getPendingMedia', {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public deletePendingMedia(user: User, media: any): Promise<any> {
    return new Promise<any[]>((resolve, reject) => {
      this.userToToken(user).then((token) => {
        const headers = new HttpHeaders({
          'authorization': `Bearer ${token}`,
          'data': media
        });

        this.http.delete(
          this.baseUrl + '/deletePendingMedia',
           {headers: headers}).subscribe((data: any) => {
          resolve(data);
        }, (err: any) => {
          reject(err);
        });
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  private userToToken(user: User): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      if (user === null) {
        reject();
      } else {
        user.getIdToken(false).then((token) => {
          resolve(token);
        }).catch((err: any) => {
          reject(err);
        });
      }
    });
  }
}
