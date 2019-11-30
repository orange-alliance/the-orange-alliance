import { Component, OnInit, Input } from '@angular/core';
import { CloudFunctions } from '../../../../providers/cloud-functions';
import Event from '../../../../models/Event';
import { User } from 'firebase/app';

@Component({
  selector: 'toa-event-add-data',
  templateUrl: './event-add-data.component.html',
  styleUrls: ['./event-add-data.component.css']
})
export class EventAddDataComponent implements OnInit {

  @Input() eventData: Event;
  @Input() eventKey: string;
  @Input() user: User;

  pitsLink: string;
  scheduleLink: string;
  venueLink: string;
  imageTitle: string;
  imageLink: string;

  constructor(
    private cloud: CloudFunctions,
  ) { }

  ngOnInit() {

  }

  sendPitsMap() {
    const mediaType = 0;
    if (this.pitsLink !== '') {
      const requestBody = {
        'event_key': this.eventKey,
        'media_type': mediaType,
        'primary': false,
        'media_title': `${this.eventData.eventName}_pitsmap`,
        'media_link': this.pitsLink
      };
      console.log(requestBody);
      this.cloud.addMediaToPending(this.user, requestBody);
    }
  }

  sendSchedule() {
    const mediaType = 1;
    if (this.pitsLink !== '') {

      const requestBody = {
        'event_key': this.eventKey,
        'media_type': mediaType,
        'primary': false,
        'media_title': `${this.eventData.eventName}_schedule`,
        'media_link': this.scheduleLink
      };
      console.log(requestBody);
      this.cloud.addMediaToPending(this.user, requestBody);
    }
  }

  sendVenueMap() {
    const mediaType = 2;
    if (this.pitsLink !== '') {
      const requestBody = {
        'event_key': this.eventKey,
        'media_type': mediaType,
        'primary': false,
        'media_title': `${this.eventData.eventName}_venuemap`,
        'media_link': this.venueLink
      };
      console.log(requestBody);
      this.cloud.addMediaToPending(this.user, requestBody);
    }
  }

  sendEventPhoto() {
    const mediaType = 6;
    if (this.pitsLink !== '') {
      const requestBody = {
        'event_key': this.eventKey,
        'media_type': mediaType,
        'primary': false,
        'media_title': this.imageTitle,
        'media_link': this.imageLink
      };
      console.log(requestBody);
      this.cloud.addMediaToPending(this.user, requestBody);
    }
  }
}
