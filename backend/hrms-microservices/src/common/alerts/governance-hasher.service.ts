import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';

/**
 * GOVERNANCE HASHER SERVICE — Phase AZ
 * 
 * Provides deterministic hashing for the kernel's governance state. 
 * Enables tamper-proof auditing and deterministic consensus verification.
 */
@Injectable()
export class GovernanceHasherService {

  /**
   * Generates a canonical SHA-256 hash of a governance state object.
   */
  hashState(state: Record<string, any>): string {
    const canonicalStr = this.stringify(state);
    return crypto.createHash('sha256').update(canonicalStr).digest('hex');
  }

  /**
   * Deterministic JSON stringify (sorts keys) to ensure stable hashing.
   * Quantizes numbers to 6 decimals to prevent floating-point drift.
   */
  private stringify(obj: any): string {
    if (obj === null) return 'null';
    
    if (typeof obj === 'number') {
      return (Math.round(obj * 1_000_000) / 1_000_000).toString();
    }

    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return `[${obj.map(o => this.stringify(o)).join(',')}]`;

    const sortedKeys = Object.keys(obj).sort();
    return `{${sortedKeys.map(k => `"${k}":${this.stringify(obj[k])}`).join(',')}}`;
  }
}
