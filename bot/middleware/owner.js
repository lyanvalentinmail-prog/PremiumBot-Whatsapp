export function requireOwner(context) {
  if (!context.isOwner) throw Object.assign(new Error('Este comando solo está disponible para el propietario.'), { code: 'OWNER_ONLY' });
}
