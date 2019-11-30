import { Component, OnInit, SecurityContext, Input } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CloudFunctions }  from '../../providers/cloud-functions';
import User from '../../models/User';
//import { User } from 'firebase';

@Component({
  selector: 'toa-pending-data',
  templateUrl: './pending-data.component.html',
  styleUrls: ['./pending-data.component.css']
})
export class PendingDataComponent implements OnInit {

  @Input() user: User;

  pendingData: any;
 
  pendingTeamData: any = {
    videos: [],
    images: [],
    logos: [],
    cads: []
  };

  pendingEventData: any = {
    pitmaps: [],
    venuemaps: [],
    schedules: [],
    images: []
  };

  pendingStreamData: any = [];

  constructor(
    protected domSanitizer: DomSanitizer,
    private cloud: CloudFunctions
  ) { }

  ngOnInit() {
    this.cloud.getPendingMedia(this.user.firebaseUser)
      .then(result => {
        this.pendingData = Object.keys(result).map(i => result[i]);
        console.log(this.pendingData);
        this.pendingData.forEach(element => {
          
          if (element["streams"] != null) {
            Object.keys(element["streams"]).forEach(stream => {
              console.log(stream);
              element["streams"][stream].media_key = stream;
              if (element["streams"][stream].media_link.includes("watch?v=")) {
                const link = element["streams"][stream].media_link.replace("watch?v=", "embed/");
                element["streams"][stream].media_link = link;
              }
              

              this.pendingStreamData.push(
                element["streams"][stream]);
            });
                       
          };

          if (element["teams"] != null) {
            Object.keys(element["teams"]).forEach(key => {
              element["teams"][key].media_key = key;
              // Sorts the team data into different media types
              switch (element["teams"][key].media_type) {
                case 1:
                  this.pendingTeamData.cads.push(element["teams"][key]);
                  break;
                case 3:
                  if (element["teams"][key].media_link.includes("watch?v=")) {
                    const link = element["teams"][key].media_link.replace("watch?v=", "embed/");
                    element["teams"][key].media_link = link;
                  }
                  this.pendingTeamData.videos.push(element["teams"][key]);
                  break;
                case 4:
                  this.pendingTeamData.images.push(element["teams"][key]);
                  break;
                case 5:
                  this.pendingTeamData.logos.push(element["teams"][key]);
                  break;
                default:
                  break;
              }
            });  
          };

          if (element["events"] != null ) {
            Object.keys(element["events"]).forEach(key => {
              element["events"][key].media_key = key;
              switch (element["events"][key].media_type) {
                case 0:
                  this.pendingEventData.pitmaps.push(element["events"][key]);
                  break;
                case 1:
                  this.pendingEventData.schedules.push(element["events"][key]);
                  break;
                case 2:
                  this.pendingEventData.venuemaps.push(element["events"][key]);
                  break;
                case 6:
                  this.pendingEventData.images.push(element["events"][key]);
                  break;
                default:
                  break;
              }
            });
          };
          
        });
        
      }).then(() => {
        console.log(this.pendingStreamData);
        console.log(this.pendingTeamData);
        console.log(this.pendingEventData);
      });
  }

  /* TODO: 
   * MessageBox to undo transaction
   * 
   * 
   */

  removeData(link: any, isStream: boolean = false): void {
    const deleteRequest = {
      id : link.media_key,
      uid: this.user.uid
    };

    const mediaType = link.media_type;

    this.cloud.deletePendingMedia(this.user.firebaseUser, JSON.stringify(deleteRequest))
      .then(() => {
        if (isStream === true) {
          this.pendingStreamData = this.pendingData.filter(stream => {
            return !this.isEquivalent(stream, link);
          })
        } else {
          if (!!link.team_key && !link.event_key) {
            switch (mediaType) {
              case 1:
                this.pendingTeamData.cads = this.pendingData.cads.filter( data => {
                  return !this.isEquivalent(data, link);
                });                
                break;
              case 3:
                this.pendingTeamData.videos = this.pendingData.videos.filter( data => {
                  return !this.isEquivalent(data, link);
                });                
                break;
              case 4:
                this.pendingTeamData.images = this.pendingData.images.filter( data => {
                  return !this.isEquivalent(data, link);
                });                
                break;
              case 5:
                this.pendingTeamData.logos = this.pendingData.logos.filter( data => {
                  return !this.isEquivalent(data, link);
                });                
                break;
              default:
                break;
            }
            
          } else if (!!link.event_key && !link.team_key) {
            switch (mediaType) {
              case 0:
                this.pendingEventData.pitmaps = this.pendingEventData.pitmaps.filter(data => {
                  return !this.isEquivalent(data, link);
                });
                
                break;
              case 1:
                this.pendingEventData.schedules = this.pendingEventData.schedules.filter(data => {
                  return !this.isEquivalent(data, link);
                });
                
                break;
              case 2:
                this.pendingEventData.venuemaps = this.pendingEventData.venuemaps.filter(data => {
                  return !this.isEquivalent(data, link);
                });
                
                break;
              case 5:
                this.pendingEventData.images = this.pendingEventData.images.filter(data => {
                  return !this.isEquivalent(data, link);
                });
                
                break;
              default:
                break;
            }
          }
        }
      });

  }

  addData(link: any, isStream: boolean = false): void {
    const deleteRequest = {
      id : link.media_key,
      uid: this.user.uid
    };

    delete link.media_key;
    
    if (isStream === true) {
      this.cloud.addStream(this.user.firebaseUser, link);
    } else {
      if (!!link.team_key && !link.event_key) {
        this.cloud.addTeamMedia(this.user.firebaseUser, link);
      } else if (!!link.event_key && !link.team_key) {
        this.cloud.addEventMedia(this.user.firebaseUser, link);
      }
    }

    this.removeData({
      ...link,
      media_key: deleteRequest.id
    }, isStream);
  }

  isEquivalent(firstObj, secObj): boolean {
    // Create arrays of property names
    var firstProps = Object.getOwnPropertyNames(firstObj);
    var secProps = Object.getOwnPropertyNames(secObj);

    // If number of properties is different,
    // objects are not equivalent
    if (firstProps.length != secProps.length) {
        return false;
    }

    for (var i = 0; i < firstProps.length; i++) {
        var propName = firstProps[i];

        // If values of same property are not equal,
        // objects are not equivalent
        if (firstObj[propName] !== secObj[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}
    


}
