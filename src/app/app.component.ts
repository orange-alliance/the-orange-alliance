import { Component, HostListener, Inject, Injectable, NgZone, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { AppBarService } from './app-bar.service';
import { isPlatformBrowser, Location } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { TranslateService } from '@ngx-translate/core';
import { FTCDatabase } from './providers/ftc-database';
import { CloudFunctions, Service } from './providers/cloud-functions';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireAuth } from '@angular/fire/auth';
import { NavigationEnd, Router } from '@angular/router';
import { EventFilter } from './util/event-utils';
import { TheOrangeAllianceGlobals } from './app.globals';
import { MdcTopAppBar, MdcDrawer } from '@angular-mdc/web';
import { MessagingService } from './messaging.service';
import Team from './models/Team';
import Event from './models/Event';

const SMALL_WIDTH_BREAKPOINT = 1240;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [FTCDatabase, TheOrangeAllianceGlobals, AppBarService]
})
@Injectable()
export class TheOrangeAllianceComponent implements OnInit {

  server: { 'is_dev': boolean, 'last_commit': string, 'build_time': string, 'api_version': string, 'mdc_version': string } = {
    'is_dev': false,
    'last_commit': null,
    'build_time': null,
    'api_version': null,
    'mdc_version': null
  };

  teams: Team[];

  events: Event[];
  eventsFilter: EventFilter;

  search: string;
  teamSearchResults: Team[];
  eventSearchResults: Event[];
  showSearch: boolean;
  showMobileSearch: boolean;

  current_year: any;
  selectedLanguage = '';

  user: firebase.User;

  matcher: MediaQueryList;
  @ViewChild(MdcTopAppBar, {static: false}) appBar: MdcTopAppBar;
  @ViewChild(MdcDrawer, {static: false}) drawer: MdcDrawer;
  title: string;

  constructor(public router: Router, private ftc: FTCDatabase, private ngZone: NgZone, private location: Location,  messaging: MessagingService,
              db: AngularFireDatabase, auth: AngularFireAuth, private translate: TranslateService, private cloud: CloudFunctions,
              private cookieService: CookieService, private appBarService: AppBarService, @Inject(PLATFORM_ID) private platformId: Object) {

    translate.setDefaultLang('en'); // this language will be used as a fallback when a translation isn't found in the current language
    if (isPlatformBrowser(this.platformId)) {
      this.selectedLanguage = this.cookieService.get('toa-lang') || translate.getBrowserLang();
      this.languageSelected();
    }

    this.router.routeReuseStrategy.shouldReuseRoute = function() {
      return false;
    };

    this.router.events.subscribe(() => {
      this.showMobileSearch = false;
      setTimeout(() => {
        this.title = this.appBarService.titleLong;
      });
    });

    this.appBarService.titleChange.subscribe(title => {
      setTimeout(() => {
        this.title = title;
      });
    });

    if (isPlatformBrowser(this.platformId)) {
      auth.authState.subscribe(user => {
        this.user = user;
      });
    }

    this.current_year = new Date().getFullYear();
    this.teamSearchResults = [];
    this.eventSearchResults = [];

    if (isPlatformBrowser(this.platformId)) {
      this.ftc.getAllTeams().then((data: Team[]) => {
        this.teams = data;
      });

      this.ftc.getAllEvents().then((data: Event[]) => {
        this.events = data;
        this.eventsFilter = new EventFilter(this.events);
      });
    }

    // Listen for foreground notifications
    messaging.receiveMessage();
    messaging.currentMessage.asObservable().subscribe((message) => {
      if (message) {
        const options = {
          body: message.body,
          icon: message.icon
        };
        const notification = new Notification(message.title, options);
        notification.onclick = () => {
          window.open(message.click_action, '_self');
        };
      }
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && isPlatformBrowser(this.platformId)) {
        (<any>window).ga('set', 'page', event.urlAfterRedirects);
        (<any>window).ga('send', 'pageview');
      }
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.matcher = matchMedia(`(max-width: ${SMALL_WIDTH_BREAKPOINT}px)`);
      this.matcher.addListener((event: MediaQueryListEvent) => this.ngZone.run(() => event.matches));
    }
  }

  isScreenSmall(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return this.router.url.startsWith('/stream') || this.matcher.matches;
    } else {
      return this.router.url.startsWith('/stream');
    }
  }

  back() {
    this.location.back();
  }

  drawerItemClicked() {
    this.drawer.open = false;
  }

  performSearch(): void {
    const maxResults = this.showMobileSearch ? 8 : 5;
    const query = this.search && this.search.trim().length > 0 ? this.search.toLowerCase().trim() : null;

    if (query && this.teams && this.eventsFilter) {
      this.teamSearchResults = this.teams.filter(team => (
        String(team.teamKey).includes(query) ||
        (team.teamNameShort && team.teamNameShort.toLowerCase().includes(query))
      ));
      this.teamSearchResults = this.teamSearchResults.splice(0, maxResults);

      this.eventsFilter.searchFilter(query);
      this.eventSearchResults = this.eventsFilter.getFilteredArray();
      this.eventSearchResults = this.eventSearchResults.splice(0, maxResults);

      if (this.teamSearchResults.length > 0 || this.eventSearchResults.length > 0) {
        this.showSearch = true;
      }
    } else {
      this.teamSearchResults = [];
      this.eventSearchResults = [];
    }
  }

  showMobileSearchModal(searchInput): void {
    this.showMobileSearch = true;
    // When the modal opens, it takes the focus.
    // We'll wait 6ms until it opens.
    setTimeout(function () {
      searchInput.focus();
    }, 600);
  }

  getBoldText(text: string): string {
    let pattern = this.search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    pattern = pattern.split(' ').filter((t) => {
      return t.length > 0;
    }).join('|');
    const regex = new RegExp(pattern, 'gi');

    return '<p>' + (this.search ? text.replace(regex, (match) => `<b>${match}</b>`) : text) + '</p>';
  }

  teamClicked(e, teamKey): void {
    this.router.navigate(['/teams', teamKey]);
    e.preventDefault();
    e.stopPropagation();
    this.sendAnalytic('search',  teamKey);
    this.showSearch = false;
    this.search = '';
  }

  eventClicked(e, eventKey): void {
    this.router.navigate(['/events', eventKey]);
    e.preventDefault();
    e.stopPropagation();
    this.sendAnalytic('search',  eventKey);
    this.showSearch = false;
    this.search = '';
  }

  @HostListener('document:click', ['$event']) clickedOutside($event) {
    this.showSearch = false;
  }
  navToTopSearch(): void {
    const query = this.search ? this.search.trim() : '';
    if (this.teamSearchResults.length > 0) {
      this.router.navigate(['/teams', this.teamSearchResults[0].teamKey]);
      this.sendAnalytic('search',  this.teamSearchResults[0].teamKey);
    } else if (this.eventSearchResults.length > 0) {
      this.router.navigate(['/events', this.eventSearchResults[0].eventKey]);
      this.sendAnalytic('search',  this.eventSearchResults[0].eventKey);
    } else if (this.search && query.length > 0 && !isNaN(parseInt(query, 10))) {
      this.router.navigate(['/teams', query]);
      this.sendAnalytic('search',  query);
    } else {
      return;
    }
    this.showSearch = false;
    this.search = '';
  }

  languageSelected(): void {
    this.cookieService.set('toa-lang', this.selectedLanguage, 365, '/'); // 365 days, one year
    this.translate.use(this.selectedLanguage);
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
