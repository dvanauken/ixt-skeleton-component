import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IxtSkeletonComponent } from './ixt-skeleton/ixt-skeleton.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IxtSkeletonComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ixt-skeleton-component';
}
