import { NgtUniversalModule } from '@ng-toolkit/universal';
import { CommonModule } from '@angular/common';
import { TransferHttpCacheModule } from '@nguniversal/common';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { CookieService } from 'ngx-cookie-service';

import { AngularFireModule } from '@angular/fire';
import { AngularFireDatabaseModule } from '@angular/fire/database';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFireMessagingModule } from '@angular/fire/messaging';
import { environment } from '../environments/environment';

import { TheOrangeAllianceComponent } from './app.component';
import { HomeComponent } from './views/home/home.component';
import { AddDataComponent } from './views/add-data/add-data.component';
import { ManageEventsComponent } from './views/account/subpages/manage-events/manage-events.component';
import { UsersComponent } from './views/account/subpages/users/users.component';
import { CreateEventComponent } from './views/account/subpages/create-event/create-event.component';
import { CacheComponent } from './views/account/subpages/cache/cache.component';
import { RetrieverComponent } from './views/account/subpages/retriever/retriever.component';
import { AccountComponent } from './views/account/account.component';
import { EventsComponent } from './views/events/events.component';
import { TeamsComponent } from './views/teams/teams.component';
import { EventComponent } from './views/event/event.component';
import { RegionsComponent } from './views/regions/regions.component';
import { AboutComponent } from './views/about/about.component';
import { ApiDocsComponent } from './views/apidocs/apidocs.component';

import { FTCDatabase } from './providers/ftc-database';
import { CloudFunctions } from './providers/cloud-functions';
import { UploadService } from './providers/imgur';
import { EventInsightsComponent } from './views/event/subviews/event-insights/event-insights.component';
import { EventForParticipantsComponent } from './views/event/subviews/event-for-participants/event-for-participants.component';
import { EventRankingsComponent } from './views/event/subviews/event-rankings/event-rankings.component';
import { EventAlliancesComponent } from './views/event/subviews/event-alliances/event-alliances.component';
import { EventMatchesComponent } from './views/event/subviews/event-matches/event-matches.component';
import { EventTeamsComponent } from './views/event/subviews/event-teams/event-teams.component';
import { EventAwardsComponent } from './views/event/subviews/event-awards/event-awards.component';
import { EventAdminComponent } from './views/event/subviews/event-admin/event-admin.component';
import { PageNotFoundComponent } from './views/404/404.component';
import { TeamComponent } from './views/team/team.component';
import { StreamingComponent } from './views/stream/streaming.component';
import { PrivacyTermsComponent } from './views/privacy_terms/PrivacyTerms.component';
import { MatchesComponent } from './views/matches/matches.component';
import { AppMaterialModule } from './material.module';
import { DialogText } from './dialogs/text/dialog-text';
import { DialogMatch } from './dialogs/match/dialog-match';
import { DialogEventFavorite } from './dialogs/event-favorite/dialog-event-favorite';
import { MatchDetailsComponent } from './views/matches/details/match-details.component';
import { MatchTableComponent } from './components/match-table/match-table.component';
import { EventItemComponent } from './components/event/event.item.component';
import { ModifiedEventItemComponent } from './components/modified_event/modified-event.item.component';
import { TeamItemComponent } from './components/team/team.item.component';
import { AwardItemComponent } from './components/award/award.item.component';
import { InsightsCardComponent } from './components/insights-card/insights-card.component';
import { CircularPercentageComponent } from './components/circular-percentage/circular-percentage.component';
import { LoginComponent } from './views/account/login/login.component';
import { RegisterComponent } from './views/account/register/register.component';
import { TeamRobotComponent } from './views/team/subviews/team-robot/team-robot.component';
import { TeamResultsComponent } from './views/team/subviews/team-results/team-results.component';
import { StreamItemComponent } from './components/stream-item/stream-item.component';
import { Insights1819Component } from './components/insights-card/years/insights1819component';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { LeagueCreatorComponent } from './views/account/subpages/league-creator/league-creator.component';
import { LeagueItemComponent } from './components/league/league.item.component';
import { ServerItemComponent } from './components/server/server.item.component';
import { SafePipe } from './safe.pipe';
import { HttpErrorHandler } from './http-error-handler.service';
import { EventAddStreamComponent } from './views/event/subviews/event-add-stream/event-add-stream.component';
import { PendingDataComponent } from './components/pending-data/pending-data.component';
import { ManagePendingDataComponent } from './views/account/subpages/manage-pending-data/manage-pending-data.component';
import { SendStreamKeyComponent } from './views/account/subpages/send-stream-key/send-stream-key.component';
import { EventAddDataComponent } from './views/event/subviews/event-add-data/event-add-data.component';

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, '/assets/i18n/', '.json?v=20041510');
}

@NgModule({
  declarations: [
    TheOrangeAllianceComponent,
    HomeComponent,
    AddDataComponent,
    ManageEventsComponent,
    UsersComponent,
    CreateEventComponent,
    CacheComponent,
    RetrieverComponent,
    AccountComponent,
    LoginComponent,
    RegisterComponent,
    EventsComponent,
    RegionsComponent,
    TeamsComponent,
    EventComponent,
    AboutComponent,
    TeamComponent,
    LeagueItemComponent,
    EventForParticipantsComponent,
    EventRankingsComponent,
    EventAlliancesComponent,
    EventMatchesComponent,
    EventTeamsComponent,
    EventAwardsComponent,
    EventInsightsComponent,
    EventAdminComponent,
    TeamRobotComponent,
    TeamResultsComponent,
    StreamItemComponent,
    PageNotFoundComponent,
    ApiDocsComponent,
    StreamingComponent,
    PrivacyTermsComponent,
    MatchDetailsComponent,
    MatchesComponent,
    TeamRobotComponent,
    DialogText,
    DialogMatch,
    DialogEventFavorite,
    MatchTableComponent,
    EventItemComponent,
    ModifiedEventItemComponent,
    TeamItemComponent,
    AwardItemComponent,
    InsightsCardComponent,
    CircularPercentageComponent,
    Insights1819Component,
    LeagueCreatorComponent,
    SafePipe,
    EventAddStreamComponent,
    PendingDataComponent,
    ManagePendingDataComponent,
    SendStreamKeyComponent,
    EventAddDataComponent,
    ServerItemComponent
  ],
  entryComponents: [
    DialogText,
    DialogMatch,
    DialogEventFavorite
  ],
  imports: [
    // Angular Uni Stuff
    CommonModule,
    NgtUniversalModule,
    TransferHttpCacheModule,
    HttpClientModule,
    BrowserModule.withServerTransition({ appId: 'server-app' }),
    // Firebase Stuffs
    AngularFireModule.initializeApp(environment.firebase, 'T'),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFireStorageModule,
    AngularFireMessagingModule,
    // Translator Stuff
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule,
    AppMaterialModule,

  ],
  providers: [FTCDatabase, CloudFunctions, UploadService, CookieService, {provide: 'externalUrlRedirectResolver', useValue: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {window.location.href = (route.data as any).externalUrl}}, HttpErrorHandler],
  bootstrap: [TheOrangeAllianceComponent]
})
export class AppModule { }
