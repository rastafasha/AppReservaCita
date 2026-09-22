export class DoctorAddress {
    id?: number;              // Opcional porque en creación no tiene ID todavía
    user_id!: number;         // ID del Doctor
    name_consultorio!: string; // Ej: "Consultorio Clínico Norte"
    address!: string;         // Dirección exacta de la sede
    is_active!: boolean;
}