/**
 * BANCOSOL - Service: Export
 * Generación de reportes en formato Excel
 */

const XLSX = require('xlsx');

const exportService = {
  /**
   * Generar Excel a partir de un array de objetos
   */
  exportToExcel(data, sheetName = 'Reporte') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generar buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buf;
  }
};

module.exports = exportService;
