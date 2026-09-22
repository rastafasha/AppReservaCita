import { Component,  Input, } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent  {

  // Mantenemos el @Input por si viene del padre, pero priorizamos la escucha reactiva
  @Input() tiendaSelected: any = null;

  private tiendaSubscription!: Subscription;

  
}
