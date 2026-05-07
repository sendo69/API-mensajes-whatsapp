/**
 * Valida y normaliza un número de teléfono para el formato que espera WhatsApp.
 * WhatsApp usa el formato: código de país + número (sin espacios, guiones ni '+')
 * Ejemplo: 573001234567 (Colombia)
 */
export const normalizePhoneNumber = (phone: string): string => {
  // Eliminar espacios, guiones, paréntesis y el símbolo +
  let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');

  // Si el número empieza con "0", lo removemos (formato local colombiano)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Si no tiene código de país (menos de 12 dígitos para Colombia), asumimos Colombia (+57)
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = `57${cleaned}`;
  }

  return cleaned;
};

/**
 * Valida que el número tenga un formato razonable (solo dígitos, longitud correcta)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const normalized = normalizePhoneNumber(phone);
  // Un número válido tiene entre 10 y 15 dígitos
  return /^\d{10,15}$/.test(normalized);
};
