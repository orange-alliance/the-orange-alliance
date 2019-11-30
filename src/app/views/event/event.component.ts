import { Component, OnInit } from '@angular/core';
import { AppBarService } from '../../app-bar.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FTCDatabase } from '../../providers/ftc-database';
import { CloudFunctions } from '../../providers/cloud-functions';
import { TeamSorter } from '../../util/team-utils';
import { AwardSorter } from '../../util/award-utils';
import { MatchSorter } from '../../util/match-utils';
import { TheOrangeAllianceGlobals } from '../../app.globals';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { DialogEventFavorite } from '../../dialogs/event-favorite/dialog-event-favorite';
import { MdcDialog, MdcMenuSelectedEvent, MdcSnackbar } from '@angular-mdc/web';
import { CookieService } from 'ngx-cookie-service';
import { User, messaging } from 'firebase/app';
import { Location } from '@angular/common';
import Event from '../../models/Event';
import EventLiveStream from '../../models/EventLiveStream';
import Media from '../../models/Media';
import Alliance from '../../models/Alliance';
import EventInsights from '../../models/Insights';
import League from '../../models/League';

@Component({
  providers: [FTCDatabase, TheOrangeAllianceGlobals],
  selector: 'toa-event',
  templateUrl: './event.component.html',
  styleUrls: ['./event.component.scss']
})
export class EventComponent implements OnInit {

  eventKey: string;
  eventData: Event;
  matchesPerTeam: number;
  stream: EventLiveStream;
  alliances: Alliance[];
  qualInsights: EventInsights = null;
  elimInsights: EventInsights = null;
  media: Media[];
  divisions: Event[] = [];

  activeTab = -1;
  totalmedia = 0;
  totalteams: any;
  totalmatches: any;
  totalrankings: any;
  totalalliances: any;
  totalawards: any;

  allLeagues: League[];
  eventLeague: League;
  nullLeague = new League();

  user: User = null;
  emailVerified = true;
  admin: boolean;
  toaAdmin = false;
  userSettings: any;

  currentUrl: string;
  possiblePages: string[];

  constructor(private ftc: FTCDatabase, private route: ActivatedRoute, private router: Router, private app: TheOrangeAllianceGlobals, private dialog: MdcDialog, private snackbar: MdcSnackbar,
              public db: AngularFireDatabase, public auth: AngularFireAuth, private appBarService: AppBarService, private cloud: CloudFunctions, private loca: Location, private cookieService: CookieService) {
    this.eventKey = this.route.snapshot.params['event_key'];
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('/')[this.router.url.split('/').length - 1];
    this.possiblePages = ['rankings', 'matches', 'teams', 'alliances', 'awards', 'insights', 'media', 'admin', 'add-stream', 'add-data'];
    if (this.eventKey) {

      this.auth.authState.subscribe(user => {
        if (user !== null && user !== undefined) {
          this.user = user;

          this.cloud.getEventSettings(this.user, this.eventKey).then((data: any) => {
            this.userSettings = data;

            const COOKIEKEY = 'event_notification_settings_info';
            if (messaging.isSupported() && !this.cookieService.check(COOKIEKEY) && this.eventKey.startsWith('1819-CMP-DET')) {
              const snackbarRef = this.snackbar.open('Do you know you can get push notifications about results in real time? Just click on the star button.', 'Amazing!', {
                timeoutMs: 10000
              });

              snackbarRef.afterDismiss().subscribe(reason => {
                if (reason === 'action') {
                  this.openEventSettings();
                }
              });

              this.cookieService.set(COOKIEKEY, 'true', 365, '/'); // 365 days, one year
            }
            this.toaAdmin = this.userSettings.admin === 'toa-admin';
            this.admin = this.toaAdmin || this.userSettings.admin === 'event-admin';

            if (this.admin && this.totalrankings === 0 && this.totalalliances === 0 && this.totalmatches === 0 &&
              this.totalteams === 0 && this.totalawards === 0 && this.totalmedia === 0) {
              this.changeUrlNoRoute('admin');
            }

            if (this.admin && this.router.url.split('/')[this.router.url.split('/').length - 1] === 'admin') { // that is the original URL, no matter how many times we change it
              this.select(this.router.url.split('/')[this.router.url.split('/').length - 1]);
            }
          });
        }
      });

      this.ftc.getEvent(this.eventKey).then((data: Event) => {
        if (data) {
          this.eventData = data;

          this.app.setTitle(this.eventData.eventName);
          let appDesc = `Event results for the ${new Date(this.eventData.startDate).getFullYear()} ${this.eventData.eventName} FIRST Tech Challenge in `;
          appDesc = appDesc + `${this.eventData.stateProv ? this.eventData.stateProv + ', ' + this.eventData.country : this.eventData.country }`;
          this.app.setDescription(appDesc);
          this.appBarService.setTitle(new Date(this.eventData.startDate).getFullYear() + ' ' + this.eventData.eventName, true);

          if (this.eventData.matches) {
            this.eventData.matches = new MatchSorter().sort(this.eventData.matches, 0, this.eventData.matches.length - 1);
          }

          if (this.eventData.awards) {
            this.eventData.awards = new AwardSorter().sort(this.eventData.awards);
          }

          if (this.eventData.teams) {
            this.eventData.teams = new TeamSorter().sortEventParticipant(this.eventData.teams);
          }

          this.totalteams = this.eventData.teams.length;
          this.totalmatches = this.eventData.matches.length;
          this.totalrankings = this.eventData.rankings.length;
          this.totalalliances = this.eventData.alliances.length;
          this.totalawards = this.eventData.awards.length;

          this.ftc.getEventStreams(this.eventKey).then((eventLiveStream: EventLiveStream[]) => {
            if (eventLiveStream && eventLiveStream.length > 0) {
              this.stream = eventLiveStream[0];
            }
          });

          this.ftc.getEventMedia(this.eventKey).then((eventMedia: Media[]) => {
            this.media = eventMedia;
            if (this.media && this.media.length > 0 && !this.hasEventEnded()) {
              this.totalmedia = this.media.length;
              if (this.totalteams === 0 && this.totalmatches === 0 && this.totalrankings === 0 && this.totalawards === 0) {
                this.changeUrlNoRoute('media');
              }
              if (this.router.url.split('/')[this.router.url.split('/').length - 1] === 'media') { // that is the original URL, no matter how many times we change it
                this.select(this.router.url.split('/')[this.router.url.split('/').length - 1]);
              }
            } else if (this.router.url.split('/')[this.router.url.split('/').length - 1] === 'media' && this.media.length < 1) {
              this.changeUrlNoRoute('rankings');
            }
          });

          this.ftc.getEventInsights(this.eventKey, 'quals').then((insights) => {
            this.qualInsights = insights;
            if (this.router.url.split('/')[this.router.url.split('/').length - 1] === 'insights') { // that is the original URL, no matter how many times we change it
              this.select(this.router.url.split('/')[this.router.url.split('/').length - 1]);
            }
          }).catch(() => console.log('Qual Insights Failed to Load'));
          this.ftc.getEventInsights(this.eventKey, 'elims').then((insights) => {
            this.elimInsights = insights;
            if (this.router.url.split('/')[this.router.url.split('/').length - 1] === 'insights') { // that is the original URL, no matter how many times we change it
              this.select(this.router.url.split('/')[this.router.url.split('/').length - 1]);
            }
          }).catch(() => console.log('Elim Insights Failed to Load'));

          // Find matches per team                           // Can't divide by 0
          if (this.eventData.matches && this.eventData.teams && this.eventData.teams.length > 0) {
            let matches = 0;
            let surrogateTeams = 0;
            for (const match of this.eventData.matches) {
              if (match.tournamentLevel === 1 && match.participants.length === 4) {
                matches++;
                for (const participant of match.participants) {
                  if (participant.stationStatus === 0) {
                    surrogateTeams++;
                  }
                }
              }
            }
            const number = ((matches * 4) - surrogateTeams) / this.eventData.teams.length;
            if (number === 6 || number === 5) {
              this.matchesPerTeam = number;
            }
          }


          // Search division in the same Event
          if (this.eventData.divisionName && this.eventData.divisionKey <= 2) {
            const eventKey = this.eventData.eventKey.substr(0, this.eventData.eventKey.length - 1); // Remove division key
            const divisions = [0, 1, 2].filter(item => item !== this.eventData.divisionKey);
            if (divisions.length === 2) {
              divisions.forEach((division) => {
                this.ftc.getEventBasic(eventKey + division).then((eventData: Event) => {
                  if (eventData.eventName === this.eventData.eventName && eventData.divisionName !== this.eventData.divisionName) {
                    if (this.divisions.length === 0) {
                      this.divisions.push(this.eventData);
                    }
                    this.divisions.push(eventData);
                    this.divisions.sort((a, b) => {
                      const division1 = a.divisionKey;
                      const division2 = b.divisionKey;
                      return (division1 > division2) ? 1 : ((division2 > division1) ? -1 : 0);
                    })
                  }
                })
              });
            }
          }

        } else {
          this.router.navigate(['/not-found']);
        }

        this.nullLeague.leagueKey = 'League';
        this.nullLeague.regionKey = 'No';
        this.nullLeague.description = 'No League Assoc.';
        // Get the leagues, as well as find the currently set league in the list
        this.ftc.getAllLeagues().then((leagues: League[]) => {
          // The professional way to insert something at the beginning of an array
          leagues.reverse();
          leagues.push(this.nullLeague);
          leagues.reverse();
          this.allLeagues = leagues;
          for (const league of leagues) {
            if (league.leagueKey === this.eventData.leagueKey) {
              this.eventLeague = league;
              break;
            }
          }
        });

        if (this.possiblePages.includes(this.router.url.split('/')[this.router.url.split('/').length - 1])) {
          this.select(this.router.url.split('/')[this.router.url.split('/').length - 1]);
        } else if (this.eventData.rankings && this.eventData.rankings.length > 0) {
          this.changeUrlNoRoute('rankings');
        } else if (this.eventData.matches && this.eventData.matches.length > 0) {
          this.changeUrlNoRoute('matches')
        } else if (this.eventData.teams.length > 0) {
          this.changeUrlNoRoute('teams');
        }
      }, (err) => {
        this.router.navigate(['/not-found']);
        console.log(err);
      })
      }
  }

  public select(view: string) {
    if (this.activeTab === -1 || this.viewNumToName(this.activeTab) !== view ) { // if view is loaded and if current view does not equal requested view
      switch (view) {
        case 'rankings':
          if (this.eventData.rankings && this.eventData.rankings.length > 0) { this.activeTab = 0;
          } else if (this.eventData.teams && this.eventData.teams.length > 0) { this.activeTab = 2; } // If no rankings, check for teams
          break;
        case 'matches':
          if (this.eventData.matches && this.eventData.matches.length > 0) { this.activeTab = 1;
          } else if (this.eventData.teams && this.eventData.teams.length > 0) { this.activeTab = 2; } // If no matches, check for teams
          break;
        case 'teams':
          if (this.eventData.teams && this.eventData.teams.length > 0) { this.activeTab = 2; }
          break;
        case 'alliances':
          if (this.eventData.alliances && this.eventData.alliances.length > 0) { this.activeTab = 3;
          } else if (this.eventData.rankings && this.eventData.rankings.length > 0) { this.activeTab = 0; // If no alliances, check for rankings
          } else if (this.eventData.teams && this.eventData.teams.length > 0) { this.activeTab = 2; } // If no rankings, check for teams
          break;
        case 'awards':
          if (this.eventData.awards && this.eventData.awards.length > 0) { this.activeTab = 4;
          } else if (this.eventData.rankings && this.eventData.rankings.length > 0) { this.activeTab = 0; // If no awards, check for rankings
          } else if (this.eventData.teams && this.eventData.teams.length > 0) { this.activeTab = 2; } // If no rankings, check for teams
          break;
        case 'insights':
          if (this.qualInsights || this.elimInsights) { this.activeTab = 5;
          } else if (this.eventData.rankings && this.eventData.rankings.length > 0) { this.activeTab = 0; // If no insights, check for rankings
          } else if (this.eventData.teams && this.eventData.teams.length > 0) { this.activeTab = 2; } // If no rankings, check for teams
          break;
        case 'media':
          if (this.totalmedia > 0) { this.activeTab = 6;
          } else if (this.eventData.rankings && this.eventData.rankings.length > 0) { this.activeTab = 0; // If no media, check for rankings
          } else if (this.eventData.teams && this.eventData.teams.length > 0) { this.activeTab = 2; } // If no rankings, check for teams
          break;
        case 'admin':
          if (this.admin) { this.activeTab = 7;
          } else if (this.eventData.rankings && this.eventData.rankings.length > 0) { this.activeTab = 0; // If no admin, check for rankings
          } else if (this.eventData.teams && this.eventData.teams.length > 0) { this.activeTab = 2; } // If no rankings, check for teams
          break;
        case 'add-stream':
          if (!this.admin) { this.activeTab = 8;
          } else if (this.eventData.rankings && this.eventData.rankings.length > 0) { this.activeTab = 0; // If no admin, check for rankings
          } else if (this.eventData.teams && this.eventData.teams.length > 0) { this.activeTab = 2; } // If no rankings, check for teams
          break;
        case 'add-data':
          if (!this.admin) { this.activeTab = 9;
          } else if (this.eventData.rankings && this.eventData.rankings.length > 0) { this.activeTab = 0; // If no admin, check for rankings
          } else if (this.eventData.teams && this.eventData.teams.length > 0) { this.activeTab = 2; } // If no rankings, check for teams
          break;
        default:
          this.activeTab = 0;
          break;
      }
    }
  }

  public hasEventEnded(): boolean {
    const today = new Date();
    const diff = (new Date(this.eventData.endDate).valueOf() - today.valueOf()) / 1000 / 60 / 60; // Convert milliseconds to hours
    return diff < -24; // 24 hours extra
  }

  switchDivision(event: MdcMenuSelectedEvent) {
    this.router.navigate(['/events', this.divisions[event.index].eventKey]);
  }

  openEventSettings() {
    this.dialog.open(DialogEventFavorite, {
      scrollable: true,
      data: {
        'settings': this.userSettings,
        'eventKey': this.eventKey,
        'user': this.user
      }
    });
  }

  changeUrlNoRoute(route: any) {
    this.select(route);
    if (this.currentUrl !== route ) { // if view is loaded and if current view does not equal requested view
      this.loca.go(`events/${this.eventKey}/${this.viewNumToName(this.activeTab)}`);
      this.currentUrl = route;
    }
  }

  viewNumToName(viewNumber: number) {
    switch (viewNumber) {
      case 0: return 'rankings';
      case 1: return'matches';
      case 2: return 'teams';
      case 3: return 'alliances';
      case 4: return 'awards';
      case 5: return 'insights';
      case 6: return 'media';
      case 7: return 'admin';
      case 8: return 'add-stream';
      case 9: return 'add-data';
      default: return 'rankings';
    }
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
