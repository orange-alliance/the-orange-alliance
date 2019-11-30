import { Component, Input, OnInit } from '@angular/core';
import { MdcSnackbar } from '@angular-mdc/web';
import { FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppBarService } from '../../../../app-bar.service';
import { CloudFunctions } from '../../../../providers/cloud-functions';
import { FTCDatabase} from '../../../../providers/ftc-database';
import { Router } from '@angular/router';
import Season from '../../../../models/Season';
import EventType from '../../../../models/EventType';
import Region from '../../../../models/Region';
import Event from '../../../../models/Event';
import User from '../../../../models/User';
import League from '../../../../models/League';

@Component({
  selector: 'toa-account-create-event',
  templateUrl: './create-event.component.html',
  styleUrls: ['../../account.component.scss']
})
export class CreateEventComponent implements OnInit {

  @Input() user: User;

  form: FormGroup;

  seasons: Season[];
  regions: Region[];
  eventTypes: EventType[];
  leagues: League[];

  constructor(private appBarService: AppBarService, private cloud: CloudFunctions, private ftc: FTCDatabase,
              private translate: TranslateService, private snackbar: MdcSnackbar, private router: Router) {
    this.form = new FormGroup({
      eventName: new FormControl(),
      season: new FormControl(),
      region: new FormControl(),
      league: new FormControl('no-league'),
      website: new FormControl(),
      startDate: new FormControl(),
      endDate: new FormControl(),
      divisionName: new FormControl(),
      numberFields: new FormControl(2),
      numberAlliances: new FormControl(4),
      dualDivision: new FormControl(false),
      advanced: new FormControl(false),
      eventId: new FormControl(),
      eventType: new FormControl(),
      venue: new FormControl(),
      city: new FormControl(),
      state: new FormControl(),
      country: new FormControl(),
      divisionNumber: new FormControl(0),
      advancementSpots: new FormControl(),
      advancementEvent: new FormControl()

    }, {
      validators: (control: FormGroup): ValidationErrors | null => {
        const dualDivision = control.get('dualDivision');
        const eventId = control.get('eventId');
        const lastChar = (eventId.value || '').substr((eventId.value || '').length - 1);

        return dualDivision.value && !isNaN(parseInt(lastChar, 10)) ? { 'eventIdNumber': true } : null;
      }
    });
  }

  ngOnInit() {
    this.translate.get('pages.account.manage_events').subscribe((res) => {
      this.appBarService.setTitle('myTOA - ' + res, true)
    });
    this.ftc.getAllRegions().then((data: Region[]) => {
      this.regions = data;

      const testRegion = new Region();
      testRegion.regionKey = 'TEST';
      this.regions.push(testRegion);
    });
    this.ftc.getAllSeasons().then((data: Season[]) => {
      this.seasons = data.reverse();
      this.form.controls.season.setValue(this.seasons[0].seasonKey);
    });
    this.ftc.getAllEventTypes().then((data: EventType[]) => {
      this.eventTypes = data;
    });
    this.ftc.getAllLeagues().then((data: League[]) => {
      this.leagues = data;
    });
  }

  resetAdvanced() {
    this.form.controls.numberAlliances.setValue(4);
    this.form.controls.numberFields.setValue(2);
    this.form.controls.advancementSpots.setValue('');
    this.form.controls.advancementEvent.setValue('');
  }

  resetDualDivision() {
    this.form.controls.divisionNumber.setValue(0);
    this.form.controls.divisionName.setValue('');
  }

  createEvent() {
    if ((this.form.errors || {}).eventIdNumber) {
      return this.snackbar.open('The eventId cannot end in a number!');
    } else if (this.form.invalid) {
      return this.snackbar.open('Please fill all required fields');
    }
    const event = new Event;
    const values = this.form.value;
    event.seasonKey = values.season;
    event.regionKey = values.region;
    event.eventCode = values.eventId.toUpperCase();
    event.eventKey = (event.seasonKey + '-' + event.regionKey + '-' + event.eventCode + ( values.dualDivision && values.divisionNumber ? values.divisionNumber.value : '')).toUpperCase();
    event.leagueKey = !values.league || values.league === 'no-league' ? null : values.league;
    event.eventTypeKey = values.eventType;
    event.eventName = values.eventName;
    event.divisionKey = values.dualDivision && values.divisionNumber ? values.divisionNumber : 0;
    event.divisionName = values.dualDivision && values.divisionName ? values.divisionName : null;
    event.fieldCount = values.numberFields ? values.numberFields : 2;
    event.fieldCount = values.numberAlliances ? values.numberAlliances : 4;
    event.advanceSpots = values.advancementSpots;
    event.advanceEvent = values.advancementEvent;
    event.activeTournamentLevel = '0';
    event.startDate = values.startDate;
    event.endDate = values.endDate;
    event.weekKey = this.dateToMonth(values.startDate);
    event.venue = values.venue;
    event.city = values.city;
    event.stateProv = values.state;
    event.country = values.country;
    event.isPublic = event.regionKey !== 'TEST';

    this.cloud.createEvent(this.user.firebaseUser, [event.toJSON()]).then((data) => {
      this.translate.get('pages.account.create_event_card.success').subscribe((str) => {
        this.snackbar.open(str, 'Go').afterDismiss().subscribe(reason => {
          if (reason === 'action') {
            this.router.navigateByUrl('/events/' + event.eventKey);
          }
        });
      });
    }).catch((err) => {
      this.translate.get('general.error_occurred').subscribe((str) => {
        this.snackbar.open(`${str} (HTTP-${err.status})`);
      });
    });
  }

  dateToMonth(date: number): string {
    const month = date.toString().split('-')[1];
    switch (parseInt(month, 10)) {
      case 1: return 'January';
      case 2: return 'February';
      case 3: return 'March';
      case 4: return 'April';
      case 5: return 'May';
      case 6: return 'June';
      case 7: return 'July';
      case 8: return 'August';
      case 9: return 'September';
      case 10: return 'October';
      case 11: return 'November';
      case 12: return 'December';
    }
  }
}
