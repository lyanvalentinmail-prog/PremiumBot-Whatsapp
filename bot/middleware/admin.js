export function requireAdmin(context) {
  if (!context.isGroup) throw Object.assign(new Error('Este comando solo puede usarse en grupos.'), { code: 'GROUP_ONLY' });
  if (!context.isAdmin && !context.isOwner) throw Object.assign(new Error('Este comando solo puede ser utilizado por administradores.'), { code: 'ADMIN_ONLY' });
}
