import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { Speciality } from '../models/speciality';

const baseUrl = environment.apiUrl;

@Injectable({
  providedIn: 'root'
})
export class SpecialityService {

  public speciality: Speciality;
  public specialitieslista: Speciality;


  constructor(private http: HttpClient) { }

  get token():string{
    return localStorage.getItem('token') || '';
  }


  get headers(){
    return{
      headers: {
        'x-token': this.token
      }
    }
  }


  getSpecialities() {
    const url = `${baseUrl}/specialities`;
    return this.http.get<any>(url,this.headers)
      .pipe(
        map((resp:{ok: boolean, specialities: Speciality}) => resp.specialities)
      )
  }


  getSpeciality(_id: string) {
    const url = `${baseUrl}/specialities/${_id}`;
    return this.http.get<any>(url, this.headers)
      .pipe(
        map((resp:{ok: boolean, speciality: Speciality}) => resp.speciality)
        );
  }
  
  veriificarExistencia(nombre: string) {
    const url = `${baseUrl}/specialities/existencia/${nombre}`;
    return this.http.get<any>(url, this.headers);
  }



  createSpeciality(speciality: Speciality) {
    const url = `${baseUrl}/specialities/crear`;
    return this.http.post(url, speciality, this.headers);
  }

  updateSpeciality(speciality: Speciality) {
    const url = `${baseUrl}/specialities/editar/${speciality._id}`;
    return this.http.put(url, speciality, this.headers);
  }

  deleteSpeciality(_id: string) {
    const url = `${baseUrl}/specialities/borrar/${_id}`;
    return this.http.delete(url, this.headers);
  }

  findByName(speciality: Speciality) {
    const url = `${baseUrl}/specialities/category_by_nombre/${speciality.nombre}`;
    return this.http.get(url, this.headers);
  }
}
