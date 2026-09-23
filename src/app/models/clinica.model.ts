import { environment } from "../../environments/environment";
import { Speciality } from "./speciality";

// Sincronizado con tus variables de entorno locales y de producción en Vercel
const base_url = environment.backend_node; 

// 📋 Interfaz limpia para el tipado de tus listas dinámicas estilo Apple Cards
export interface ItemDetalleMedico {
  descripcion: string;
  precio: string;
}

export class Clinica {
  constructor(
    public _id: string,
    public name: string,       // Name user / Identificador de la cuenta
    public nombre: string,     // Nombre del médico/consultorio público
    public apellido: string,
    public slug: string,       // Subdominio dinámico (ej: 'joaqun-paez')
    public user_id: string,    // ID único de vinculación relacional
    
    // 🌍 Control de Moneda y Métodos de Pago
    public moneda: string,     // 'USD', 'VES', etc.
    public acepta_usd_internacional: boolean,
    public acepta_moneda_local: boolean,

    // 🏥 Datos Exclusivos del SaaS Express (Arrays de Objetos Nativos)
    public usavacunas: boolean,
    public vacunasList: ItemDetalleMedico[],
    public Servicios_procedimientosList: ItemDetalleMedico[],
    public ConsultasyTarifasList: ItemDetalleMedico[],
    public HorariodeAtencion: string,

    // Ubicación, Contacto y Estética (Acoplados a tu Mongoose real)
    public ciudad: string,
    public address: string,    // Reemplaza a 'direccion' del modelo viejo
    public phone: string,      // Reemplaza a 'telefono' del modelo viejo
    public img_logo: string,
    public rrss: string,

    // Especialidad Médica Relacionada
    public speciality: Speciality,

    // Estados Administrativos del CRM
    public status: 'Activo' | 'Desactivado',
    public statusapp: 'TEST' | 'SUSCRITO' | 'PENDIENTE' | 'COLABORADOR',
    public planSuscripcion: 'GRATIS' | 'BASICO' | 'PRO',

    // Canal de Bots de WhatsApp
    public whatsappStatus?: 'CONECTADO' | 'DESCONECTADO' | 'ESPERANDO_QR',
    public whatsappQR?: string,
    public whatsappConnectedAt?: Date,
    
    // Fechas y Auditoría
    public dateTest?: string,
    public dateInicio?: string,
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}

  /**
   * Getter dinámico para resolver el logo del médico o la clínica
   */
  get imagenUrl(): string {
    if (!this.img_logo) {
      return `assets/img/default-doctor.png`;
    } else if (this.img_logo.includes('https')) {
      return this.img_logo; // Si viene directo de Cloudinary / URL externa
    } else {
      return `${base_url}/uploads/logos/${this.img_logo}`;
    }
  }
}
