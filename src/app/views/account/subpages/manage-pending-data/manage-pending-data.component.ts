import { Component, OnInit, Input } from '@angular/core';
import User from '../../../../models/User';

@Component({
  selector: 'toa-account-manage-pending-data',
  templateUrl: './manage-pending-data.component.html',
  styleUrls: ['./manage-pending-data.component.css']
})
export class ManagePendingDataComponent implements OnInit {

  @Input() user: User;

  constructor() { }

  ngOnInit() {
  }

}
