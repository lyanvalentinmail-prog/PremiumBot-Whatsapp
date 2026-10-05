export function requirePremium(context) {
  if (!context.isOwner && !context.user.isPremium) throw Object.assign(new Error('Este comando es exclusivo para usuarios Premium.'), { code: 'PREMIUM_ONLY' });
}
