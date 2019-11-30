import { WINDOW } from '@ng-toolkit/universal';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FTCDatabase } from '../../providers/ftc-database';
import { TheOrangeAllianceGlobals } from '../../app.globals';
import { TranslateService } from '@ngx-translate/core';
import { AppBarService } from '../../app-bar.service';
import Team from '../../models/Team';
import Region from '../../models/Region';

const TEAMS_PER_PAGE = 500;

@Component({
  selector: 'toa-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
  providers: [FTCDatabase, TheOrangeAllianceGlobals]
})
export class TeamsComponent implements OnInit {

  teams: Team[];
  currentTeams: Team[];
  regions: Region[];

  doneTypingInt = 2000;
  typingTimer;

  query: string;

  public rightSide: Team[];
  public leftSide: Team[];

  constructor(@Inject(WINDOW) private window: Window, private router: Router, private ftc: FTCDatabase, private app: TheOrangeAllianceGlobals,
              private translate: TranslateService, private appBarService: AppBarService, @Inject(PLATFORM_ID) private platformId: Object,
              private loca: Location, private route: ActivatedRoute, ) {
    const queryParam = this.route.snapshot.queryParamMap.get('query');
    this.query = (queryParam) ? queryParam : null;
    this.app.setTitle('Teams');
    this.app.setDescription(`List of FIRST Tech Challenge teams`);
  }

  ngOnInit(): void {
    this.translate.get('general.teams').subscribe((str: string) => {
      this.appBarService.setTitle(str);
    });

    this.ftc.getAllTeams().then((data: Team[]) => {
      this.teams = data;
      this.getTeams();
    });
    this.ftc.getAllRegions().then((data: Region[]) => {
      this.regions = data
    });
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
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.updateQueryParam(), this.doneTypingInt);
  }

  scrollTo(selectors: string) {
    const elementList = document.querySelectorAll(selectors);
    const element = elementList[0] as HTMLElement;
    element.scrollIntoView({ behavior: 'smooth' });
  }

  showFAB(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return this.window.pageYOffset > 200;
    } else {
      return false;
    }

  }

  changeUrlNoRoute(route: any) {
    this.loca.go(route);
  }

  updateQueryParam() {
    const query = (this.query.length > 0) ? this.query : undefined;
    const urlTree = this.router.createUrlTree([], {
      queryParams: {query: query},
      queryParamsHandling: 'merge',
      preserveFragment: true });

    this.changeUrlNoRoute(urlTree.toString());
    clearTimeout(this.typingTimer);
  }
}
