/**
 * Error con un mensaje pensado para mostrarse al usuario tal cual
 * (reglas de negocio: "caja cerrada", "mantenimiento", etc.).
 * Cualquier otro error se considera inesperado y NO se expone.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserFacingError'
  }
}