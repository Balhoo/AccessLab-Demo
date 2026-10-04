export const lessons = ['forms', 'dialog', 'contrast'];
export function contrastRatio(foreground, background) {
  const luminance = hex => {
    if (typeof hex !== 'string' || !/^#[\da-f]{6}$/i.test(hex)) throw Error('Usa colores hexadecimales de seis dígitos: #123456.');
    const values = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
    return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
  };
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
export function parseProgress(value) {
  if (!value || value.format !== 'accesslab-progress' || value.version !== 1 || !Array.isArray(value.completed) || value.completed.length > lessons.length || value.completed.some(id => !lessons.includes(id)) || new Set(value.completed).size !== value.completed.length) throw Error('Respaldo de progreso inválido.');
  return { format: 'accesslab-progress', version: 1, completed: [...value.completed] };
}
export function completeLesson(progress, lesson) { if (!lessons.includes(lesson)) throw Error('Lección desconocida.'); const valid = parseProgress(progress); return { ...valid, completed: [...new Set([...valid.completed, lesson])] }; }
export function validateAlias(value) { return typeof value === 'string' && /^[\p{L}\p{N} _-]{2,30}$/u.test(value.trim()) ? '' : 'Escribe un alias ficticio de 2 a 30 caracteres: letras, números, espacios, guion o guion bajo.'; }
