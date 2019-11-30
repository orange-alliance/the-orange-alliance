import { Component, Input, ViewChild } from '@angular/core';
import { CloudFunctions } from '../../../../providers/cloud-functions';
import { TranslateService } from '@ngx-translate/core';
import { MdcTextField } from '@angular-mdc/web';
import Event from '../../../../models/Event';
import EventLiveStream from '../../../../models/EventLiveStream';
import { User } from 'firebase/app';

@Component({
  selector: 'toa-event-add-stream',
  templateUrl: './event-add-stream.component.html',
  styleUrls: ['./event-add-stream.component.css']
})
export class EventAddStreamComponent {

  @Input() user: User;
  @Input() eventKey: string;
  @Input() eventData: Event;

  @ViewChild('stream_url', {static: false}) streamUrl: MdcTextField;
  @ViewChild('stream_name', {static: false}) streamName: MdcTextField;

  streamType = 'Youtube';
  hasStream = false;
  linkedStream: EventLiveStream;

  eventApiKey: string;
  showGetObjects: boolean;

  constructor(private cloud: CloudFunctions, private translate: TranslateService) {

  }

  addStreamToPending(): void {
    const mediaType = 3;
    const streamLink = this.getFieldText(this.streamUrl);
    const streamTitle = this.getFieldText(this.streamName);
    if (streamLink !== '') {

      const requestBody = {
        'event_key': this.eventKey,
        'media_type': mediaType,
        'primary': false,
        'media_title': streamTitle,
        'media_link': streamLink
      };

      console.log(requestBody);
      console.log(this.user);
      this.cloud.addMediaToPending(this.user, requestBody, true);
    }
  }

  streamRadioClick(type: string): void {
    this.streamType = (type) ? type : this.streamType;
    this.translate.get('pages.event.subpages.admin.stream_card.url', { provider: this.streamType }).subscribe((res: string) => {
      this.streamUrl.label = res;
      this.streamUrl.disabled = true; // Forces Text on the text box to update
      this.streamUrl.disabled = false;
    });
  }

  getFieldText(elm: MdcTextField) {
    return elm.value;
  }

  requestStreamKey() {
    console.log('An email will be sent!');
  }

}
