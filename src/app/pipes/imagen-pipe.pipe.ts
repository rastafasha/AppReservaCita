import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

const base_url = environment.url_backend

@Pipe({
  name: 'imagenPipe'
})
export class ImagenPipe implements PipeTransform {

  transform(img: string, tipo: 'staffs'): string {

    if(!img){
      // return `${base_url}/assets/images/no-image.jpg`;
      return `./assets/img2.jpg`;
    } else if(img.includes('https')){
      return img;
    } else if(img){
      return `${base_url}/uploads/${tipo}/${img}`;
    }else {
      return `${base_url}/uploads/no-image.jpg`;
    }


  }

}
