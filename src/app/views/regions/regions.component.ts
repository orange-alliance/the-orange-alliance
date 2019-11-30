import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AppBarService } from '../../app-bar.service';
import { Router } from '@angular/router';
import { FTCDatabase } from '../../providers/ftc-database';
import { EventFilter, EventSorter } from '../../util/event-utils';
import { TheOrangeAllianceGlobals } from '../../app.globals';
import {MdcSelect, MdcTabBar} from '@angular-mdc/web';
import Event from '../../models/Event';
import EventInsights from '../../models/Insights';
import Season from '../../models/Season';
import Region from '../../models/Region';
import Week from '../../models/Week';
import {MatchSorter} from '../../util/match-utils';
import Team from '../../models/Team';

const TEAMS_PER_PAGE = 100;

@Component({
  providers: [FTCDatabase, TheOrangeAllianceGlobals],
  selector: 'toa-regions',
  templateUrl: './regions.component.html'
})
export class RegionsComponent implements OnInit {

  seasons: Season[];
  regions: Region[];
  events: Event[];

  weekNumber: number;
  weeks: Map<string, Week>;
  availableWeeks: Week[];

  currentSeason: Season = null;
  currentRegion: Region;

  eventFilter: EventFilter;

  eventKey = '1920-FIM-PFQ1';
  eventData: Event;
  qualInsights: EventInsights = null;
  elimInsights: EventInsights = null;
  
  teams: Team[];
  currentTeams: Team[];

  query: string;

  public rightSide: Team[];
  public leftSide: Team[];


  @ViewChild('tabbar', {static: false}) tabbar: MdcTabBar;
  @ViewChild('current_region', {static: false}) regionSelector: MdcSelect;
  @ViewChild('current_season', {static: false}) seasonSelector: MdcSelect;

  constructor(private ftc: FTCDatabase, private router: Router, private app: TheOrangeAllianceGlobals,
              private translate: TranslateService, private appBarService: AppBarService) {
    this.app.setTitle('Events');
    this.app.setDescription(`List of FIRST Tech Challenge events`);
    this.weeks = new Map<string, Week>();
  }

  ngOnInit(): void {
    this.translate.get('general.events').subscribe((str: string) => {
      this.appBarService.setTitle(str);
    });

    if (this.eventKey) {
        this.ftc.getEvent(this.eventKey).then((data: Event) => {
          if (data) {
            this.eventData = data;

            if (this.eventData.matches) {
              this.eventData.matches = new MatchSorter().sort(this.eventData.matches, 0, this.eventData.matches.length - 1);
            }
            this.ftc.getEventInsights(this.eventKey, 'quals').then((insights) => {
              this.qualInsights = insights;
            }).catch(() => console.log('Qual Insights Failed to Load'));
            this.ftc.getEventInsights(this.eventKey, 'elims').then((insights) => {
              this.elimInsights = insights;
            }).catch(() => console.log('Elim Insights Failed to Load'));

          }
        }, (err) => {
          console.log(err);
        });
    }
	
	this.app.setTitle("Regions");
	
	this.translate.get('general.regions').subscribe((str: string) => {
      this.appBarService.setTitle(str);
    });

    this.ftc.getAllTeams().then((data: Team[]) => {
      this.teams = data;
      this.getTeams();
    });
    this.ftc.getAllRegions().then((data: Region[]) => {
      this.regions = data
    });

    this.ftc.getAllSeasons().then((data: Season[]) => {
      this.seasons = data.reverse();
      this.selectSeason(this.getCurrentSeason());
    });

    this.ftc.getAllRegions().then((data: Region[]) => {
      const allRegions: Region = new Region();
      allRegions.regionKey = 'All Regions';
      this.regions = [
        allRegions,
        ...data
      ];
      this.currentRegion  = allRegions;
    });
  }

  organizeEventsByWeek(): void {
    this.weeks.clear();
    for (const event of this.events) {
      if (this.weeks.get(event.weekKey) === undefined) {
        this.weeks.set(event.weekKey, {
          weekKey: event.weekKey,
          startDate: event.startDate,
          endDate: event.endDate
        });
      } else {
        this.weeks.get(event.weekKey).endDate = event.endDate;
      }
    }
    this.availableWeeks = Array.from(this.weeks.values());
    this.select(0);
  }

  getMonday(d: any): Date {
    d = new Date(d);
    const day = d.getDay(),
      diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }

  getSunday(d: any): Date {
    d = new Date(d);
    const day = d.getDay(),
      diff = d.getDate() + 6 - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }

  getEventsByWeek(week: Week): Event[] {
    const filteredEvents = [];
    for (const event of this.events) {
      if (event.weekKey === week.weekKey) {
        filteredEvents.push(event);
      }
    }
    return filteredEvents;
  }

  onSeasonChange(event: {index: any, value: any}) {
    event.index = (event.index < 0) ? 0 : event.index;
    this.selectSeason(this.seasons[event.index])
  }
  
   getTeams() {
    const query = this.query && this.query.trim().length > 0 ? this.query.toLowerCase().trim() : null;
    if (query) {
      let isRegion = false;
      if (this.regions && query) {
        for (const region of this.regions) {
          if (region.regionKey.toLowerCase() === query) {
            isRegion = true;
          }
        }
      }

      if (isRegion) {
        this.currentTeams = this.teams.filter(team => (
          team.regionKey.toLowerCase() === query
        ));
      } else {
        this.currentTeams = this.teams.filter(team => (
          String(team.teamNumber).includes(query) ||
          (team.teamNameShort && team.teamNameShort.toLowerCase().includes(query)) ||
          (team.city && team.city.toLowerCase().includes(query)) ||
          (team.country && team.country.toLowerCase().includes(query))
        ));
      }
    } else {
      this.currentTeams = this.teams;
    }

    if (this.currentTeams.length === 1) {
      this.leftSide = [this.currentTeams[0]];
      this.rightSide = [];
    } else {
      this.currentTeams = this.currentTeams.slice(0, TEAMS_PER_PAGE);
      this.leftSide = this.currentTeams.slice(0, this.currentTeams.length / 2);
      this.rightSide = this.currentTeams.slice(this.currentTeams.length / 2, this.currentTeams.length);
    }
  }

  selectSeason(season: Season) {
    if (this.currentSeason === null || this.currentSeason.seasonKey !== season.seasonKey) {
      this.currentSeason = season;
      return this.ftc.getSeasonEvents(this.currentSeason.seasonKey).then((data: Event[]) => {
        this.events = new EventSorter().sort(data);
        this.eventFilter = new EventFilter(this.events);
        this.selectRegion(this.currentRegion)
      }).catch(() => {
        this.events = [];
        this.eventFilter = new EventFilter(this.events);
        this.selectRegion(this.currentRegion)
      });
    }
    return null;
  }

  onRegionChange (event: {index: any, value: any}) {
    event.index = (event.index < 0) ? 0 : event.index;
    this.selectRegion(this.regions[event.index])
  }

  selectRegion(region: Region) {
    this.currentRegion = region;
    if (this.currentRegion !== undefined && this.currentRegion.description) {
      this.eventFilter.filterArray(this.currentRegion.regionKey);
      this.events = this.eventFilter.getFilteredArray();
    } else if (this.eventFilter !== undefined) {
      this.events = this.eventFilter.getOriginalArray();
    }
    this.events = new EventSorter().sort(this.events);
    this.organizeEventsByWeek();
  }

  clearFilter() {
    this.currentRegion = this.regions[0];

    const defaultSeason = this.getCurrentSeason();
    if (defaultSeason.seasonKey === this.currentSeason.seasonKey) {
      this.currentSeason = defaultSeason;
      this.events = this.eventFilter.getOriginalArray();
      this.organizeEventsByWeek();
    } else {
      this.selectSeason(defaultSeason);
    }
  }

  getCurrentSeason(): Season {
    for (const season of this.seasons) {
      if (season.seasonKey === this.ftc.year) {
        return season;
      }
    }
    return null;
  }

  public getWeekName(week): string {
    switch (week) {
      case 'CMP':
        return 'FIRST Championship';
      case 'CMPHOU':
        return 'FIRST Championship - Houston';
      case 'CMPSTL':
        return 'FIRST Championship - St. Louis';
      case 'CMPDET':
        return 'FIRST Championship - Detroit';
      case 'ESR':
        return 'East Super Regional Championship';
      case 'NSR':
        return 'North Super Regional Championship';
      case 'SSR':
        return 'South Super Regional Championship';
      case 'WSR':
        return 'West Super Regional Championship';
      case 'SPR':
        return 'Super Regionals';
      case 'FOC':
        return 'Festival of Champions';
      default:
        if (week.match('-?\\d+(\\.\\d+)?')) { // match a number with optional '-' and decimal.
          return 'Week ' + week;
        } else {
          return week;
        }
    }
  }

  public select(index) {
    if (this.weeks && this.weeks.size > index) {
      if (this.tabbar) {
        this.tabbar.activateTab(index);
      }
      this.weekNumber = index;
    }
  }

  public isSelected(index): boolean {
    return this.weekNumber === index;
  }

  getSeasonString(seasonKey: string, description?: string) {
    const codeOne = seasonKey.toString().substring(0, 2);
    const codeTwo = seasonKey.toString().substring(2, 4);

    if (description) {
      return '20' + codeOne + '/' + codeTwo + ' - ' + description;
    } else {
      return '20' + codeOne + '/' + codeTwo;
    }
  }

  getRegionString(regionKey: string, description?: string) {
    if (description) {
      return regionKey + ' - ' + description;
    } else {
      return regionKey;
    }
  }

}
