import { Component, OnInit } from '@angular/core';
import { TheOrangeAllianceGlobals } from '../../app.globals';
import { Router } from '@angular/router';
import { FTCDatabase } from '../../providers/ftc-database';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { TeamSorter } from '../../util/team-utils';
import { EventSorter } from '../../util/event-utils';
import { MdcSnackbar } from '@angular-mdc/web';
import { TranslateService } from '@ngx-translate/core';
import { isPlatformBrowser, Location, LocationStrategy, PathLocationStrategy } from '@angular/common';
import { CloudFunctions } from '../../providers/cloud-functions';
import { auth as providers, messaging as fcm } from 'firebase/app';
import 'firebase/messaging';
import { AppBarService } from '../../app-bar.service';
import { environment } from '../../../environments/environment';
import { MessagingService } from '../../messaging.service';
import TOAUser from '../../models/User';
import Team from '../../models/Team';
import Event from '../../models/Event';
import Region from '../../models/Region';

@Component({
  selector: 'toa-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  providers: [CloudFunctions, TheOrangeAllianceGlobals, Location, {provide: LocationStrategy, useClass: PathLocationStrategy}]
})

export class AccountComponent implements OnInit {

  firebaseUser: firebase.User = null;
  user: TOAUser = null;
  activeTab = -1;

  teams: Team[];
  events: Event[];
  regions: Region[];

  notifications: string = null;
  generatingApiKey: boolean;
  emailVerified = true;
  googleProvider = new providers.GoogleAuthProvider();
  githubProvider = new providers.GithubAuthProvider();
  phoneProvider;
  recaptchaVerifier;

  showCaptcha = true;
  isDevMode = false;
  isSupported: boolean;


            // TODO: LocalStorage doesnt work in SSR
  constructor(/*@Inject(LOCAL_STORAGE) private localStorage: any,*/ app: TheOrangeAllianceGlobals, private router: Router, private appBarService: AppBarService, private snackbar: MdcSnackbar,
              private db: AngularFireDatabase, private auth: AngularFireAuth, private cloud: CloudFunctions, private translate: TranslateService,
              private loca: Location, private ftc: FTCDatabase, private messaging: MessagingService) {

    app.setTitle('myTOA');
    app.setDescription('Your myTOA account overview');

    if (this.router.url === '/account/create-league') {
      this.activeTab = 1;
    }  else if (this.router.url === '/account/new-event') {
      this.activeTab = 2;
    } else if (this.router.url === '/account/users') {
      this.activeTab = 3;
    } else if (this.router.url === '/account/cache') {
      this.activeTab = 4;
    } else if (this.router.url === '/account/retriever') {
      this.activeTab = 5;
    } else if (this.router.url === '/account/pending-data') {
      this.activeTab = 6;
    } else {
      this.activeTab = 0;
    }

    this.isDevMode = !environment.production;

    if (isPlatformBrowser(this)) {
      auth.auth.languageCode = translate.getBrowserLang() || 'en';
    } else {
      auth.auth.languageCode = 'en';
    }

    this.phoneProvider = new providers.PhoneAuthProvider(auth.auth);

    auth.authState.subscribe(firebaseUser => {
      if (firebaseUser) {
        this.firebaseUser = firebaseUser;
        this.getUser();
      } else {
        this.router.navigateByUrl('/account/login');
      }
    });

    this.notifications = Notification ? Notification.permission : null;

    this.ftc.getAllRegions().then((regions: Region[]) => {
      this.regions = regions
    });
  }

  ngOnInit() {
    this.appBarService.setTitle('myTOA', true);
    this.isSupported = fcm && fcm.isSupported();
  }

  getUser() {
    if (this.firebaseUser !== null) {
      this.cloud.getUserData(this.firebaseUser, 'exclude-region').then((user: TOAUser) => {
        this.user = user;
        this.user.firebaseUser = this.firebaseUser;
        this.emailVerified = this.user.emailVerified;
        this.generatingApiKey = this.user.apiKey !== null;

        this.teams = [];
        for (const key of this.user.favoriteTeams) {
          this.ftc.getTeamBasic(key).then((team: Team) => {
            if (team) {
              this.teams.push(team);
              this.teams = new TeamSorter().sort(this.teams);
            }
          });
        }

        this.events = [];
        for (const key of this.user.favoriteEvents) {
          this.ftc.getEventBasic(key).then((event: Event) => {
            if (event) {
              this.events.push(event);
              this.events = new EventSorter().sort(this.events);
            }
          });
        }
      }).catch((error) => {
        if (error.status) {
          this.emailVerified = false;
        }
      });
    }
  }


  getDebugInput(title: string) {
    const input = prompt(title, '');
    if (input === null || input.trim() === '' || input === undefined) {
      return this.getDebugInput(title);
    } else {
      return input;
    }
  }

  renderCaptcha() {
    this.showCaptcha = true;
    this.recaptchaVerifier = new providers.RecaptchaVerifier('recaptcha', {
      'size': 'normal',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        this.linkPhone();
      }});
    this.recaptchaVerifier.render().then((result) => { }).catch( (error) => { console.error(error); });
  }

  linkPhone() {
    const phoneNumber = this.getDebugInput('Enter your phone number');
    let confResult;
    // TODO: move the db calls to backend
    this.firebaseUser.linkWithPhoneNumber(phoneNumber, this.recaptchaVerifier).then((confirmationResult) => {
      // SMS sent. Prompt user to type the code from the message
      confResult = confirmationResult;
      return this.getDebugInput('Please enter the confirmation code sent to your phone');
    }).then((code) => {
      return confResult.confirm(code);
    }).then((result) => {
      this.db.object(`Phones/${phoneNumber.substr(1)}/opted`).query.once('value').then(items => {
        if (items.val() !== false) {
          return this.db.object(`Phones/${phoneNumber.substr(1)}/opted`).set(true);
        } else {
          return;
        }
      });
    }).then( (resp) => {
      return this.db.object(`Phones/${phoneNumber.substr(1)}/uid`).set(`${this.user.uid}`);
    }).then( (resp) => {
      this.translate.get('pages.account.success_link', {name: this.getProviderName(this.phoneProvider)}).subscribe((res: string) => {
        this.snackbar.open(res)
      });
      this.getUser();
    }).catch( (error) => {
      // Error; SMS not sent
      console.log(error);
      this.showSnackbar('general.error_occurred');
    });
    this.showCaptcha = false;
  }

  signOut(): void {
    this.auth.auth.signOut().then(() => {

      this.router.navigateByUrl('/account/login');
    });
  }

  generateApiKey(): void {
    if (this.emailVerified) {
      this.generatingApiKey = true;
      this.cloud.generateApiKey(this.firebaseUser).then(key => {
        this.user.apiKey = key;
        this.generatingApiKey = false;
      }).catch(console.log);
    }
  }

  sendEmailVerification() {
    this.firebaseUser.sendEmailVerification().then(() => {
      // Show Success
      this.translate.get('pages.event.subpages.admin.success_sent_verify_email').subscribe((success_sent: string) => {
        this.snackbar.open(success_sent);
      });
    }).catch((error) => {
      // Show Fail
      console.log(error);
      this.translate.get('general.error_occurred').subscribe((error_string: string) => {
        this.snackbar.open(error_string);
      });
    });
  }

  sendPasswordResetEmail() {
    this.auth.auth.sendPasswordResetEmail(this.user.email).then( () => {
      // Show success in snackbar
      this.translate.get('pages.account.reset_password_email').subscribe((res: string) => {
        this.snackbar.open(res)
      });
    }).catch( error => {
      // Show Error in snackbar
      this.translate.get('general.error_occurred').subscribe((res: string) => {
        console.log(error);
        this.snackbar.open(res)
      });
    })
  }

  linkProvider(provider: firebase.auth.AuthProvider) {
    this.firebaseUser.linkWithPopup(provider).then(result => {
      // Accounts successfully linked.
      const credential = result.credential;
      const user = result.user;

      this.getUser();

      // Show success in snackbar
      this.translate.get('pages.account.success_link', {name: this.getProviderName(provider)}).subscribe((res: string) => {
        this.snackbar.open(res)
      });
    }).catch(error => {
      this.translate.get('general.error_occurred').subscribe((res: string) => {
        console.log(error);
        this.snackbar.open(res)
      });
    });
  }

  unlinkProvider(provider: firebase.auth.AuthProvider) {
    // Don't leave the user without any provider
    const phoneNumber = this.firebaseUser.phoneNumber;
    if (this.firebaseUser.providerData.length > 1) {
      this.firebaseUser.unlink(provider.providerId).then(result => {
        if (provider.providerId.indexOf('hone') > -1) {
          this.db.object(`Phones/${phoneNumber.substr(1)}/uid`).remove();
        }

        this.getUser();

        // Show success in snackbar
        this.translate.get('pages.account.success_unlink', {name: this.getProviderName(provider)}).subscribe((res: string) => {
          this.snackbar.open(res)
        });
      }).catch(error => {
        this.translate.get('general.error_occurred').subscribe((res: string) => {
          console.log(error);
          this.snackbar.open(res)
        });
      });
    } else {
      this.translate.get('general.error_occurred').subscribe((res: string) => {
        this.snackbar.open(res)
      });
    }
  }

  getProviderName(provider: firebase.auth.AuthProvider) {
    let name: string = provider.providerId;
    name = name.replace('.com', '');
    name = name.charAt(0).toUpperCase() + name.slice(1);
    return name;
  }

  sendAnalytic(category, label, action): void {
    (<any>window).ga('send', 'event', {
      eventCategory: category,
      eventLabel: label,
      eventAction: action,
      eventValue: 10
    });
  }

  showSnackbar(translateKey: string, errorKey?: string, value?: number) {
    const isEmail = (errorKey) ? errorKey.indexOf('428') > -1 : undefined;
    const msg = (isEmail) ? 'pages.event.subpages.admin.verify_email' : translateKey;
    this.translate.get(msg, {value: value}).subscribe((res: string) => {
      const message = (errorKey && !isEmail) ? `${res} (${errorKey})` : res;
      const snackBarRef = this.snackbar.open(message, isEmail ? 'Verify' : null);
      snackBarRef.afterDismiss().subscribe(reason => {
        if (reason === 'action') {
          if (isEmail) {
            this.firebaseUser.sendEmailVerification().then(() => {
              this.showSnackbar(`pages.event.subpages.admin.success_sent_verify_email`);
            }).catch((err) => {
              this.showSnackbar(`general.error_occurred`, `HTTP-${err.status}`);
            })
          }
        }
      });
    });
  }

  requestPermission() {
    this.messaging.requestPermission(this.user.firebaseUser).then(() => {
      this.notifications = Notification ? Notification.permission : null;
    }).catch(() => {
      this.notifications = Notification ? Notification.permission : null;
    });
  }

  changeUrlNoRoute(route: any) {
    this.loca.go(`account/${route}`);
  }
}
