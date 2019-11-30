import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './views/home/home.component';
import { AccountComponent } from './views/account/account.component';
import { EventsComponent } from './views/events/events.component';
import { RegionsComponent } from './views/regions/regions.component';
import { TeamComponent } from './views/team/team.component';
import { TeamsComponent } from './views/teams/teams.component';
import { EventComponent } from './views/event/event.component';
import { AboutComponent } from './views/about/about.component';
import { ApiDocsComponent } from './views/apidocs/apidocs.component';
import { StreamingComponent } from './views/stream/streaming.component';
import { PrivacyTermsComponent } from './views/privacy_terms/PrivacyTerms.component';
import { PageNotFoundComponent } from './views/404/404.component';
import { MatchesComponent } from './views/matches/matches.component';
import { AddDataComponent } from './views/add-data/add-data.component';
import { LoginComponent } from './views/account/login/login.component';
import { RegisterComponent } from './views/account/register/register.component';

const donateUrl = 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=CDE5Q5XXPM25J&source=toa_donate_link';

const routes: Routes = [
  { path: 'kickoff', redirectTo: '/stream?kickoff' },
  { path: 'home', component: HomeComponent },
  { path: 'account',  children: [
      { path: '', component: AccountComponent },
      { path: 'pending-data', component: AccountComponent},
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'create-league', component: AccountComponent },
      { path: 'events', component: AccountComponent },
      { path: 'new-event', component: AccountComponent },
      { path: 'users', component: AccountComponent },
      { path: 'cache', component: AccountComponent },
      { path: 'retriever', component: AccountComponent }
    ]
  },
  { path: 'add-data', component: AddDataComponent },
  { path: 'events', component: EventsComponent },
  { path: 'teams', component: TeamsComponent },
  { path: 'regions', component: RegionsComponent },
  { path: 'about', component: AboutComponent },
  { path: 'apidocs', component: ApiDocsComponent,  children: [
      { path: '', redirectTo: 'get', pathMatch: 'full' },
      { path: 'get', component: ApiDocsComponent },
      { path: 'post', component: ApiDocsComponent },
      { path: 'put', component: ApiDocsComponent },
      { path: 'delete', component: ApiDocsComponent },
      { path: 'models', component: ApiDocsComponent },
      { path: 'types', component: ApiDocsComponent }
    ]
  },
  { path: 'stream', component: StreamingComponent },
  { path: 'privacy-terms', component: PrivacyTermsComponent },
  { path: 'events/:event_key', component: EventComponent,  children: [
      { path: '', redirectTo: 'rankings', pathMatch: 'full' },
      { path: 'rankings', component: EventComponent },
      { path: 'matches', component: EventComponent },
      { path: 'teams', component: EventComponent },
      { path: 'awards', component: EventComponent },
      { path: 'alliances', component: EventComponent },
      { path: 'media', component: EventComponent },
      { path: 'insights', component: EventComponent },
      { path: 'admin', component: EventComponent }
    ]
  },
  { path: 'teams/:team_key', component: TeamComponent },
  { path: 'matches/:match_key', component: MatchesComponent },
  { path: 'not-found', component: PageNotFoundComponent },
  { path: 'livedocs', redirectTo: 'https://github.com/orange-alliance/TOA-DataSync/wiki/DataSync-Documentation', pathMatch: 'full' },
  { path: 'terms', redirectTo: '/privacy-terms', pathMatch: 'full' },
  { path: 'privacy', redirectTo: '/privacy-terms', pathMatch: 'full' },
  { path: 'donate', component: HomeComponent, resolve: {url: 'externalUrlRedirectResolver'}, data: {externalUrl: donateUrl}},
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    anchorScrolling: 'enabled'
  })],
  exports: [RouterModule]
})

export class AppRoutingModule {}
