/**
 * Utilidades de validación y sanitización
 */
class Validator {
  static sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  static sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/<[^>]*>/g, '')
               .trim();
  }

  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static validatePhone(phone) {
    const regex = /^[\+]?[1-9][\d]{0,15}$/;
    return regex.test(phone.replace(/\s/g, ''));
  }

  static validateURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    return {
      isValid: validTypes.includes(file.type) && file.size <= maxSize,
      error: !validTypes.includes(file.type) ? 'Tipo de archivo no válido' :
             file.size > maxSize ? 'Archivo muy grande (máx 5MB)' : null
    };
  }

  static validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && !value.trim())) {
      throw new Error(`${fieldName} es requerido`);
    }
    return true;
  }

  static validateLength(value, min, max, fieldName) {
    if (value.length < min || value.length > max) {
      throw new Error(`${fieldName} debe tener entre ${min} y ${max} caracteres`);
    }
    return true;
  }

  static validateNumber(value, min, max, fieldName) {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`${fieldName} debe ser un número entre ${min} y ${max}`);
    }
    return true;
  }

  static validateColor(color) {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  static escapeSQL(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/'/g, "''");
  }

  static validateJSON(jsonString) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }
}

window.Validator = Validator;