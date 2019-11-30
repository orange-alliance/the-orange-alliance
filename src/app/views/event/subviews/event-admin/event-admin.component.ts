import {Component, OnInit, AfterViewInit, Input, ViewChild, AfterContentInit, ChangeDetectorRef} from '@angular/core';
import { FTCDatabase } from '../../../../providers/ftc-database';
import { CloudFunctions } from '../../../../providers/cloud-functions';
import { UploadService } from '../../../../providers/imgur';
import { AngularFireDatabase } from '@angular/fire/database';
import {MdcSelect, MdcSnackbar, MdcTextField} from '@angular-mdc/web';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { User } from 'firebase/app';
import Event from '../../../../models/Event';
import EventLiveStream from '../../../../models/EventLiveStream';
import League from '../../../../models/League';

@Component({
  providers: [CloudFunctions, UploadService],
  selector: 'toa-event-admin',
  templateUrl: './event-admin.component.html',
  styleUrls: ['./event-admin.component.scss']
})
export class EventAdminComponent implements OnInit, AfterViewInit {

  @Input() user: User;
  @Input() eventKey: string;
  @Input() eventData: Event;
  @Input() league: League;
  @Input() leagues: League[];
  @Input() toaAdmin: boolean;

  currentLeague: League = this.league;

  deleteEvent1 = true;
  deleteEvent2 = false;
  deleteEvent3 = false;
  deleteEvent4 = false;

  playlistURL: string;
  videos: any[];
  loadingVideos: boolean;
  showGetObjects: boolean;
  showConfirm: boolean;
  uploadingVideos: boolean;

  images: any = {};
  pitsMap = 'pits_map';
  schedule = 'schedule';
  venueMap = 'venue_map';

  streamType = 'Youtube';
  hasStream = false;
  linkedStream: EventLiveStream;

  // These are for updating the Event Info
  @ViewChild('event_name', {static: false}) eventName: MdcTextField;
  @ViewChild('start_date', {static: false}) startDate: MdcTextField;
  @ViewChild('end_date', {static: false}) endDate: MdcTextField;
  @ViewChild('website', {static: false}) website: MdcTextField;
  @ViewChild('venue', {static: false}) venue: MdcTextField;
  @ViewChild('city', {static: false}) city: MdcTextField;
  @ViewChild('state', {static: false}) state: MdcTextField;
  @ViewChild('country', {static: false}) country: MdcTextField;
  @ViewChild('league_selector', {static: false}) leagueSelector: MdcSelect;

  @ViewChild('stream_url', {static: false}) streamUrl: MdcTextField;
  @ViewChild('stream_name', {static: false}) streamName: MdcTextField;

  constructor(
    private cloud: CloudFunctions,
    private db: AngularFireDatabase,
    private snackbar: MdcSnackbar,
    private translate: TranslateService,
    private router: Router,
    public imgur: UploadService,
    private ftc: FTCDatabase,
    private cd: ChangeDetectorRef) {

  }

  ngOnInit() {
    this.showGetObjects = true;

    this.ftc.getAllStreams().then((data: EventLiveStream[]) => {
      for (const stream of data) {
        if (stream.eventKey === this.eventData.eventKey) {
          this.hasStream = stream.isActive;
          this.linkedStream = stream;
          break;
        }
      }
    });
  }

  ngAfterViewInit() {
    // Setup the edit event
    this.setFieldText(this.eventName, this.eventData.eventName);
    this.setFieldText(this.startDate, this.eventData.startDate.substr(0, 10));
    this.setFieldText(this.endDate, this.eventData.endDate.substr(0, 10));
    this.setFieldText(this.website, this.eventData.website);

    this.setFieldText(this.website, this.eventData.website);
    this.setFieldText(this.venue, this.eventData.venue);
    this.setFieldText(this.city, this.eventData.city);
    this.setFieldText(this.state, this.eventData.stateProv);
    this.setFieldText(this.country, this.eventData.country);

    this.setFieldText(this.streamName, this.eventData.divisionName ? this.eventData.eventName + ' - ' + this.eventData.divisionName + ' Division' : this.eventData.eventName);

    this.currentLeague = null;
    for (const i in this.leagues) {
      if (this.leagues.hasOwnProperty(i) && this.league !== undefined) {
        if (this.leagues[i].leagueKey === this.league.leagueKey) {
          this.leagueSelector.setSelectedIndex(parseInt(i, 0))
          this.currentLeague = this.leagues[i];
        }
      } else {
        this.leagueSelector.setSelectedIndex(0);
      }
    }
    this.cd.detectChanges();
  }

  streamRadioClick(type: string): void {
    this.streamType = (type) ? type : this.streamType;
    this.translate.get('pages.event.subpages.admin.stream_card.url', { provider: this.streamType }).subscribe((res: string) => {
      this.streamUrl.label = res;
      this.streamUrl.disabled = true; // Forces Text on the text box to update
      this.streamUrl.disabled = false;
    });
  }

  onLeagueChange(event: {index: any, value: any}) {
    if (event.index > 0) {
      this.currentLeague = this.leagues[event.index];
    } else {
      this.currentLeague = null;
    }
  }

  addStream(): void {
    let streamLink;
    let channelLink;
    let channelName;
    let streamType;
    const twitchRegex = new RegExp('^(?:https?:\\/\\/)?(?:www\\.|go\\.)?twitch\\.tv\\/([a-z0-9_]+)($|\\?)');
    const youtubeRegex = new RegExp('(?:youtube(?:-nocookie)?\\.com\\/(?:[^\\/\\n\\s]+\\/\\S+\\/|(?:v|e(?:mbed)?)\\/|\\S*?[?&]v=)|youtu\\.be\\/)([a-zA-Z0-9_-]{11})');
    if (this.streamType === 'Twitch' && twitchRegex.exec(this.streamUrl.value)) {
      const channelId = twitchRegex.exec(this.streamUrl.value)[1];
      streamLink = 'https://player.twitch.tv/?channel=' + channelId;
      channelLink = 'https://twitch.tv/' + channelId;
      channelName = channelId;
      streamType = 1;
    } else if (this.streamType === 'Youtube' && youtubeRegex.exec(this.streamUrl.value)) {
      const vidId = youtubeRegex.exec(this.streamUrl.value)[1];
      streamLink = 'https://www.youtube.com/embed/' + vidId;
      channelLink = 'https://www.youtube.com/watch?v=' + vidId;
      channelName = ''; // TODO: Implement Youtube API in here at some point
      streamType = 0;
    }

    if (streamLink) {
      const stream = new EventLiveStream();
      stream.streamKey = this.eventData.eventKey + '-LS1';
      stream.eventKey = this.eventData.eventKey;
      stream.channelName = channelName;
      stream.streamName = this.getFieldText(this.streamName);
      stream.streamType = streamType;
      stream.isActive = true;
      stream.streamURL = streamLink;
      stream.startDateTime = new Date(this.eventData.startDate).toJSON().slice(0, 19).replace('T', ' ');
      stream.endDateTime = new Date(this.eventData.endDate).toJSON().slice(0, 19).replace('T', ' ');
      stream.channelURL = channelLink;

      this.cloud.addStream(this.user, [stream.toJSON()]).then( (data: {}) => {
        this.showSnackbar('pages.event.subpages.admin.stream_card.success_linked');
        this.hasStream = true;
        this.linkedStream = stream;
      }, (err) => {
        this.showSnackbar('general.error_occurred', `HTTP-${err.status}`);
      }).catch(console.log);
    } else {
      this.showSnackbar('general.error_occurred', 'S-URL');
    }
  }

  removeStream(): void {
    this.linkedStream.startDateTime = new Date(this.eventData.startDate).toJSON().slice(0, 19).replace('T', ' ');
    this.linkedStream.endDateTime = new Date(this.eventData.endDate).toJSON().slice(0, 19).replace('T', ' ');
    this.cloud.hideStream(this.user, [this.linkedStream.toJSON()]).then( (data: {}) => {
      this.showSnackbar('pages.event.subpages.admin.stream_card.success_unlinked');
      this.hasStream = false;
      this.linkedStream = null;
    }, (err) => {
      this.showSnackbar('general.error_occurred', `HTTP-${err.status}`);
    }).catch(console.log);
  }

  playlistMatchify() {
    const playlistId = /[&|\?]list=([a-zA-Z0-9_-]+)/gi.exec(this.playlistURL || '');

    if (playlistId && playlistId.length > 0) {
      this.playlistURL = '';
      this.videos = [];
      this.loadingVideos = true;
      this.cloud.playlistMatchify(this.user, this.eventKey, playlistId[1]).then((data: {}) => {
        this.loadingVideos = false;
        if (data && data['matches'].length > 0) {
          this.videos = data['matches'];
          this.showGetObjects = false;
          this.showConfirm = true;
        } else {
          this.showSnackbar('pages.event.subpages.admin.playlist_card.error');
        }
      }, (err) => {
        this.loadingVideos = false;
        this.showSnackbar('general.error_occurred', `HTTP-${err.status}`);
      });
    } else {
      this.showSnackbar('pages.event.subpages.admin.playlist_card.invalid_url');
    }
  }

  setVideos() {
    if (this.videos && this.videos.length > 0) {
      this.uploadingVideos = true;
      const toUpload = [];
      this.videos.forEach(function (video) {
        toUpload.push({
          'match_key': video['match_key'],
          'video_url': video['video_url']
        })
      });
      this.cloud.setVideos(this.user, this.eventKey, toUpload).then((data: {}) => {
        this.uploadingVideos = false;
        this.showGetObjects = true;
        this.showConfirm = false;

        this.showSnackbar('pages.event.subpages.admin.playlist_card.successfully', null, this.videos.length);

        this.videos = [];
      }, (err) => {
        this.uploadingVideos = false;
        this.showSnackbar('general.error_occurred', `HTTP-${err.status}`);
      });
    } else {
      this.showSnackbar('pages.event.subpages.admin.playlist_card.error');
    }
  }

  updateEvent() {
    const json = {
     'event_key': this.eventKey,
     'season_key': this.eventData.seasonKey,
     'event_name': this.getFieldText(this.eventName),
     'start_date': `${this.getFieldText(this.startDate)} 00:00:00`,
     'end_date': `${this.getFieldText(this.endDate)} 00:00:00`,
     'venue': this.getFieldText(this.venue),
     'city': this.getFieldText(this.city),
     'state_prov': this.getFieldText(this.state),
     'country': this.getFieldText(this.country),
     'website': this.getFieldText(this.website),
     'league_key': (this.currentLeague === null) ? null : this.currentLeague.leagueKey
    };

    this.cloud.updateEvent(this.user, this.eventKey, json).then((data: {}) => {
      this.showSnackbar('pages.event.subpages.admin.update_info_card.successfully');
    }, (err) => {
      this.showSnackbar('general.error_occurred', `HTTP-${err.status}`);
    });
  }

  setFieldText(elm: MdcTextField, text: string) {
    elm.setValue(text);
  }

  getFieldText(elm: MdcTextField) {
    return elm.value;
  }

  showSnackbar(translateKey: string, errorKey?: string, value?: number) {
    const isEmail = (errorKey) ? errorKey.indexOf('428') > -1 : undefined;
    const msg = (isEmail) ? 'pages.event.subpages.admin.verify_email' : translateKey;

    this.translate.get(msg, {value: value}).subscribe((res: string) => {

      const message = (errorKey && !isEmail) ? `${res} (${errorKey})` : res;

      const snackBarRef = this.snackbar.open(message, (isEmail) ? 'Verify' : null);

      snackBarRef.afterDismiss().subscribe(reason => {
        if (reason === 'action') {
          this.user.sendEmailVerification().then(() => {
            this.showSnackbar(`pages.event.subpages.admin.success_sent_verify_email`);
          }).catch((err) => {
            this.showSnackbar(`general.error_occurred`, `HTTP-${err.status}`);
          })
        }
      });
    });
  }

  handleImage(e, type: string) {
    const image = e.target.files[0];
    if (image) {
      const reader = new FileReader();
      reader.onload = () => {
        this.images[type] = {
          'filename': image.name,
          'base64': btoa(reader.result.toString())
        };
      };
      reader.readAsBinaryString(image);
    }
  }

  uploadImage(type) {
    if (this.images[type]) {
      this.imgur.uploadImage(this.images[type]['base64'])
        .then((data: any) => {
          const image = data.data;
          const mediaData = {
            'event_key': this.eventKey,
            'primary': false,
            'media_link': image.link,
            'media_type': -1,
          };

          if (type === this.pitsMap) {
            mediaData.media_type = 0;
          } else if (type === this.schedule) {
            mediaData.media_type = 1;
          } else if (type === this.venueMap) {
            mediaData.media_type = 2;
          }

          if (mediaData.media_type > -1) {
            this.cloud.addEventMedia(this.user, mediaData).then(() => {
              this.showSnackbar('pages.event.subpages.admin.update_info_card.successfully');
              this.images[type] = null;
            }).catch((err) => {
              this.showSnackbar(`general.error_occurred`, `HTTP-${err.status}`);
            });
          } else {
            this.showSnackbar(`general.error_occurred`);
          }
        }, (err) => {
          this.showSnackbar('general.error_occurred', `HTTP-${err.status}`);
        });
    } else {
      this.showSnackbar(`general.error_occurred`);
    }
  }

  getFileName(type: string) {
    if (this.images[type]) {
      return this.images[type]['filename'];
    }
    return null
  }

  deleteEvent() {
    this.cloud.toaDelete(this.user, `/event/${this.eventData.eventKey}`).then((data: {}) => {
      this.router.navigate([`/events`]);
    }).catch((err) => {
      this.showSnackbar(`general.error_occurred`, `HTTP-${err.status}`);
    });
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
