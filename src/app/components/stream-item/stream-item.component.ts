import { Component, Input } from '@angular/core';
import { Router} from '@angular/router';
import EventLiveStream from "../../models/EventLiveStream";

@Component({
  selector: 'toa-stream-item',
  templateUrl: './stream-item.component.html',
  styleUrls: ['./stream-item.component.scss']
})
export class StreamItemComponent {

  @Input() id: number;
  @Input() height: string;

  @Input() streams: EventLiveStream[];
  stream: EventLiveStream = null;
  selectedStreamKey = '';

  constructor(public router: Router) {}

  getStream(streamKey: string): EventLiveStream {
    for (const stream of this.streams) {
      if (stream.streamKey === streamKey) {
        this.sendAnalytic('stream',  stream.eventKey + ', ' + stream.channelName + ', ' + stream.streamType);
        return stream;
      }
    }
    return null;
  }

  sendAnalytic(category, action): void {
    (<any>window).ga('send', 'event', {
      eventCategory: category,
      eventLabel: this.router.url,
      eventAction: action,
      eventValue: 10
    });
  }
}
