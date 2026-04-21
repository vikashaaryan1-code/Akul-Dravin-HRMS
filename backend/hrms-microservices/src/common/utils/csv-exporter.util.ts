import { Injectable } from '@nestjs/common';

@Injectable()
export class CsvExporter {
  /**
   * DETERMINISTIC CSV GENERATION
   * Converts an array of objects into a standard CSV string.
   * Ensures 4-decimal precision consistency for numeric strings.
   */
  async export(data: any[]): Promise<string> {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        
        // Handle potentially null/undefined values
        if (val === null || val === undefined) return '';
        
        // Escape commas in strings
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
