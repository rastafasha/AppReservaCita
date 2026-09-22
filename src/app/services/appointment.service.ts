import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const url_servicios = environment.url_servicios;

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  
  constructor(
    public http: HttpClient,
    public authService: AuthService,

  ) { }

  listConfig(){
    let headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token})
    let URL = url_servicios+'/appointments/config';
    return this.http.get(URL, {headers:headers});
  }
  listAppointementAtendidas(){
    let headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token})
    let URL = url_servicios+'/appointments/atendidas';
    return this.http.get(URL, {headers:headers});
  }

  lisFiter(data:any){
    let headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token});
    let URL = url_servicios+"/appointments/filter";
    return this.http.post(URL,data, {headers:headers});
  }

  getPatient(n_doc:string =''){
    let headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token});
    let URL = url_servicios+"/appointments/patient?n_doc="+n_doc;
    return this.http.get(URL, {headers:headers});
  }

  storeAppointment(data:any){
    let headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token});
    let URL = url_servicios+"/appointments/store";
    return this.http.post(URL,data, {headers:headers});
  }

  storeAppointmentExpress(data:any){
    let headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token});
    let URL = url_servicios+"/appointments/store";
    return this.http.post(URL,data, {headers:headers});
  }
  
  showAppointment(appointment_id:any){
    let headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token});
    let URL = url_servicios+"/appointments/show/"+appointment_id;
    return this.http.get(URL,{headers:headers});
  }
  showSpeciality(speciality:any){
    let headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token});
    let URL = url_servicios+"/specialities/show/"+speciality;
    return this.http.get(URL,{headers:headers});
  }

  
  lisFiterByDoctor(data:any, doctor_id:number){
    const headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token});
    const URL = url_servicios+"/appointments/filterbydoctor/"+doctor_id;
    return this.http.post(URL,data, {headers:headers});
  }
  listAppointmentDocts(
    doctor_id:any, 
    page=1, 
    search='', 
    search_patient='',
    date= '',
  ){
    const headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token});
    let LINK = "";
    if(search){
      LINK+="&search="+search;
    }
    if(search_patient){
      LINK+="&search_patient="+search_patient;
      }
    
    if(date){
      LINK+="&date="+date;
    }
    
    const URL = url_servicios+'/appointments/byDoctor/'+doctor_id+'/?page='+page+LINK;
    return this.http.get(URL, {headers:headers});
  }
  

  //cita medica
  
  showCitamedica(appointment_id:any){
    let headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token});
    let URL = url_servicios+"/appointment-atention/show/"+appointment_id;
    return this.http.get(URL,{headers:headers});
  }

  getLaboratoryByAppointment(appointment_id:any){
    let headers = new HttpHeaders({'Authorization': 'Bearer'+this.authService.token});
    let URL = url_servicios+"/laboratory/showByAppointments/"+appointment_id;
    return this.http.get(URL,{headers:headers});
  }
}
