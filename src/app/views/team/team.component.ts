import { WINDOW } from '@ng-toolkit/universal';
import { Component, OnInit, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AppBarService } from '../../app-bar.service';
import { FTCDatabase } from '../../providers/ftc-database';
import { CloudFunctions } from '../../providers/cloud-functions';
import { MatchSorter } from '../../util/match-utils';
import { EventSorter } from '../../util/event-utils';
import { AwardSorter } from '../../util/award-utils';
import { TheOrangeAllianceGlobals } from '../../app.globals';
import { AngularFireAuth } from '@angular/fire/auth';
import Team from '../../models/Team';
import Match from '../../models/Match';
import Season from '../../models/Season';
import Event from '../../models/Event';
import AwardRecipient from '../../models/AwardRecipient';
import Ranking from '../../models/Ranking';
import Media from '../../models/Media';
import TeamSeasonRecord from '../../models/TeamSeasonRecord';
import EventParticipant from '../../models/EventParticipant';
import TOAUser from '../../models/User';
import {isPlatformBrowser} from '@angular/common';
import { MediaService } from '../../media.service';
//import { HttpHeaderResponse } from '@angular/common/http';
//import {MdcSelect} from '@angular-mdc/web';
//import { request } from 'https';

@Component({
  selector: 'toa-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss'],
  providers: [FTCDatabase, TheOrangeAllianceGlobals]
})
export class TeamComponent implements OnInit {

  team: Team;
  teamKey: string;
  teamLogo: Media;
  years: any;
  seasons: Season[];
  currentSeason: Season;
  view_type: string;
  wlt: TeamSeasonRecord = null;
  topOpr: Ranking;
  images: any = {};
  
  imageLink: string;
  imageTitle: string;
  logoLink: string;
  cadLink: string;
  cadTitle: string;
  youtubeLink: string;
  youtubeTitle: string;

  user: TOAUser = null;
  favorite: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    @Inject(WINDOW) private window: Window, 
    private ftc: FTCDatabase, 
    private route: ActivatedRoute, 
    private router: Router, 
    private app: TheOrangeAllianceGlobals,
    public cloud: CloudFunctions, 
    public auth: AngularFireAuth, 
    private appBarService: AppBarService,
    private mediaService: MediaService) {

    this.teamKey = this.route.snapshot.params['team_key'];
    this.select('results');

  }

  public ngOnInit(): void {
    this.auth.authState.subscribe(user => {
      if (user !== null && user !== undefined) {
        this.cloud.getUserData(user).then((userData: TOAUser) => {
          this.user = userData;
          userData.firebaseUser = user;
          this.favorite = userData.favoriteTeams.includes(this.teamKey);
        });
      }
    });

    this.years = [];
    this.ftc.getTeamBasic(this.teamKey).then((team: Team) => {
      if (team) {
        this.team = team;
        this.team.media = null;
        this.team.awards = []; // Remove the awards, they arrive later
        for (let i = this.team.rookieYear; i <= new Date().getFullYear(); i++) {
          this.years.push(i);
        }
        this.years.reverse();
        if (this.team.rookieYear >= 0) {
          this.ftc.getAllSeasons().then((data: Season[]) => {
            this.seasons = this.getTeamSeasons(data).reverse();
            for (const season of this.seasons) {
              if (season.seasonKey === this.ftc.year) {
                this.selectSeason(season);
              }
            }
          });
        }
        if (this.team.teamNameShort !== null) {
          this.app.setTitle(`${this.team.teamNameShort} (${this.team.teamNumber})`);
          this.appBarService.setTitle(`#${this.team.teamNumber} ${this.team.teamNameShort}`, true);
        } else {
          this.app.setTitle(`${Team} ${this.team.teamNumber}`);
          this.appBarService.setTitle(`Team # ${this.team.teamNumber}`, true);
        }
        this.app.setDescription(`Team information and competition results for FIRST Tech Challenge Team #${ this.team.teamNumber } from ${team.city}, ${(team.stateProv ? team.stateProv + ', ' : '') + team.country }.`);
      } else {
        this.router.navigate(['/not-found']);
      }
    }, (err) => {
      console.log(err);
      this.router.navigate(['/not-found']);
    })
  }

  public getTeamSeasons(seasons: Season[]): Season[] {
    const pad = (num) => (num < 10 ? '0' : '') + num;
    const yearCode = parseInt((this.team.rookieYear + '').toString().substring(2, 4), 10);
    const secondCode = yearCode + 1;
    const rookieSeasonId = pad(yearCode) + pad(secondCode);

    for (let i = 0; i < seasons.length; i++) {
      if (rookieSeasonId === seasons[i].seasonKey) {
        return seasons.splice(i, seasons.length - 1);
      }
    }
    return seasons;
  }

  public onSeasonChange(event: {index: any, value: any}) {
    event.index = (event.index < 0) ? 0 : event.index;
    this.selectSeason(this.seasons[event.index])
  }

  public selectSeason(season: Season) {
    this.currentSeason = season;
    this.team.events = [];
    this.ftc.getTeamEvents(this.teamKey, this.currentSeason.seasonKey).then((data: EventParticipant[]) => {
      Promise.all(data.map((result: any) => this.ftc.getEventBasic(result.eventKey).catch(e => null)))
        .then(events => {
          this.team.events = events.filter(result => result !== null);
          this.getEventMatches();
          this.getEventRankings();
          this.getEventAwards();
        });
    }).catch(() => {
      this.team.events = [];
    });
    this.getTeamMedia();
    this.getTeamWLT();
  }

  private getEventMatches() {
    this.team.events = new EventSorter().sort(this.team.events).reverse();
    for (const event of this.team.events) {
      this.ftc.getEventMatches(event.eventKey).then((data: Match[]) => {
        event.matches = data;
        event.matches = this.sortAndFind(event);
      });
    }
  }

  private getEventRankings() {
    this.ftc.getTeamResults(this.teamKey, this.currentSeason.seasonKey).then((data: Ranking[]) => {
      this.getTopOpr(data);
      for (const event of this.team.events) {
        for (const ranking of data) {
          if (ranking.eventKey.toUpperCase() === event.eventKey.toUpperCase()) {
            event.rankings = [ranking];
            break;
          }
        }
      }
    });
  }

  private getEventAwards() {
    this.ftc.getTeamAwards(this.teamKey, this.currentSeason.seasonKey).then((data: AwardRecipient[]) => {
      this.team.awards = data;
      for (const event of this.team.events) {
        let awards = [];
        for (const award of data) {
          if (event.eventKey === award.eventKey) {
            awards.push(award);
          }
        }
        if (awards) {
          awards = new AwardSorter().sort(awards);
        }
        event.awards = awards;
      }
    });
  }

  private getTeamMedia() {
    this.select('results');
    this.team.media = null;
    this.ftc.getTeamMedia(this.teamKey, this.currentSeason.seasonKey).then((data: Media[]) => {
      this.team.media = [];
      for (const media of data) {
        if (media.mediaType === 5) {
          this.teamLogo = media;
        } else {
          this.team.media.push(media)
        }
      }
    });
  }

  private getTeamWLT() {
    this.wlt = null;
    if (this.currentSeason.seasonKey) {
      this.ftc.getTeamWLT(this.teamKey, this.currentSeason.seasonKey).then((wlt: TeamSeasonRecord) => {
        if (wlt) {
          this.wlt = wlt;
        }
      });
    } else {
      this.wlt = new TeamSeasonRecord();
    }
  }

  private sortAndFind(event: Event): Match[] {
    let teamMatches = [];
    for (const match of event.matches) {
      for (const team of match.participants) {
        if (team.teamKey === this.teamKey) {
          teamMatches.push(match);
        }
      }
    }

    const sorter = new MatchSorter();
    teamMatches = sorter.sort(teamMatches, 0, teamMatches.length - 1);
    return teamMatches;
  }

  openMatchDetails(match_data: any) {
    this.router.navigate(['/matches', match_data.match_key]);
  }

  getSeasonString(seasonKey: string, description?: string) {
    const codeOne = seasonKey.toString().substring(0, 2);
    const codeTwo = seasonKey.toString().substring(2, 4);

    if (description) {
      return `20${codeOne}/${codeTwo} - ${description}`;
    } else {
      return `20${codeOne}/${codeTwo}`;
    }
  }

  beautifulURL(website: string) {
    website = website.substr( website.indexOf(':') + 3 ); // Taking off the http/s
    if (website.endsWith('/') || website.endsWith('?') || website.endsWith('#')) { // Taking off unnecessary chars
      website = website.substr( 0, website.length - 1 );
    }

    return website.startsWith('www.') ? website.substring(4, website.length) : website;
  }

  scrollToEvent(id: string) {
    const element = document.getElementById(id);
    if (element && isPlatformBrowser(this.platformId)) {
      this.window.scroll({
        behavior: 'smooth',
        left: 0,
        top: element.getBoundingClientRect().top - 85
      });
    }
  }

  toggleTeam(): void {
    if (this.favorite) { // Remove from favorites
      this.cloud.removeFromFavorite(this.user.firebaseUser, this.teamKey, 'team').then(() => {
        this.favorite = false;
      });
    } else { // Add to favorites
      this.cloud.addToFavorite(this.user.firebaseUser, this.teamKey, 'team').then(() => {
        this.favorite = true;
      });
    }
  }

  public select(view_type) {
    this.view_type = view_type;
  }

  public isSelected(view_type): boolean {
    return this.view_type === view_type;
  }

  getTopOpr(events: Ranking[]): void {
    let topOPR = new Ranking();
    for (const ranking of events) {
      if (ranking.opr > topOPR.opr) {
        topOPR = ranking;
      }
    }
    this.topOpr = topOPR;
  }

  sendAnalytic(category, action): void {
    (<any>this.window).ga('send', 'event', {
      eventCategory: category,
      eventLabel: this.router.url,
      eventAction: action,
      eventValue: 10
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


  sendReveal() {
    const mediaType = 3;
    if (this.youtubeLink !== "") {

      const requestBody = {
        "team_key": this.teamKey,
        "media_type": mediaType,
        "primary": false,
        "media_title": this.youtubeTitle,
        "media_link": this.youtubeLink
      }

      console.log(requestBody);
      this.cloud.addMediaToPending(this.user.firebaseUser, requestBody);      
    }
    
  }

  sendRoboPic() {
    const mediaType = 4;
    if (this.imageLink !== "") {
      const requestBody = {
        "team_key": this.teamKey,
        "media_type": mediaType,
        "primary": false,
        "media_title": this.imageTitle,
        "media_link": this.imageLink
      }
      console.log(requestBody);
      this.cloud.addMediaToPending(this.user.firebaseUser, requestBody);
    }
  }

  sendTeamLogo() {
    const mediaType = 5;
    if (this.imageLink !== "") {
      const requestBody = {
        "team_key": this.teamKey,
        "media_type": mediaType,
        "primary": false,
        "media_title": `${this.team.teamNameShort}_logo`,
        "media_link": this.logoLink
      }
      console.log(requestBody);
      this.cloud.addMediaToPending(this.user.firebaseUser, requestBody);
    }
  }

  sendCad() {
    const mediaType = 1;
    if (this.cadLink !== "") {
      const requestBody = {
        "team_key": this.teamKey,
        "media_type": mediaType,
        "primary": false,
        "media_title": this.cadTitle,
        "media_link": this.cadLink
      }
      console.log(requestBody);
      this.cloud.addMediaToPending(this.user.firebaseUser, requestBody);
    }
  }
}
