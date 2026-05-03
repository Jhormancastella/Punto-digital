/**
 * Utilidades de formateo compartidas
 */
class Formatters {
  /**
   * Formatea precio en formato colombiano
   */
  static formatPrice(price) {
    const numPrice = typeof price === 'string' ? parseInt(price) : price;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numPrice);
  }

  /**
   * Genera estrellas HTML para rating
   */
  static generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        starsHTML += '<i class="fas fa-star"></i>';
      } else if (i === fullStars && hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
      } else {
        starsHTML += '<i class="far fa-star"></i>';
      }
    }
    
    return starsHTML;
  }

  /**
   * Capitaliza primera letra
   */
  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Formatea números con separadores de miles
   */
  static formatNumber(num) {
    return new Intl.NumberFormat('es-CO').format(num);
  }

  /**
   * Trunca texto con ellipsis
   */
  static truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }
}

// Exportar para uso global
window.Formatters = Formatters;