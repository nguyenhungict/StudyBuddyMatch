import { Injectable } from '@nestjs/common';

export interface ViolationResult {
  hasViolation: boolean;
  violations: Violation[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Violation {
  type: string;
  keyword: string;
  position: number;
  context: string;
}

export enum ViolationType {
  SPAM = 'SPAM',
  HATE_SPEECH = 'HATE_SPEECH',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  PROFANITY = 'PROFANITY',
  SCAM = 'SCAM',
  FAKE_INFORMATION = 'FAKE_INFORMATION',
}

@Injectable()
export class ViolationDetectionService {
  // Default violation keywords (can be loaded from DB later)
  private violationKeywords: Map<ViolationType, string[]> = new Map([
    [
      ViolationType.SPAM,
      [
        'click here',
        'free money',
        'limited offer',
        'act now',
        'urgent',
        'guaranteed',
        'no risk',
      ],
    ],
    [
      ViolationType.HATE_SPEECH,
      [
        'hate',
        'discrimination',
        'racist',
        'sexist',
        'homophobic',
        'transphobic',
      ],
    ],
    [
      ViolationType.HARASSMENT,
      [
        'bully',
        'threat',
        'intimidate',
        'harass',
        'stalk',
        'abuse',
      ],
    ],
    [
      ViolationType.INAPPROPRIATE_CONTENT,
      [
        'explicit',
        'nsfw',
        'adult content',
        'inappropriate',
      ],
    ],
    [
      ViolationType.PROFANITY,
      [
        'curse word 1',
        'curse word 2',
        'profanity',
      ],
    ],
    [
      ViolationType.SCAM,
      [
        'phishing',
        'scam',
        'fraud',
        'fake',
        'trick',
        'deceive',
      ],
    ],
    [
      ViolationType.FAKE_INFORMATION,
      [
        'fake news',
        'misinformation',
        'disinformation',
        'hoax',
      ],
    ],
  ]);

  /**
   * Scan text content for violations
   * @param content - The text content to scan
   * @param contentType - Type of content (message, comment, post)
   * @returns ViolationResult with detected violations
   */
  scanContent(content: string, contentType: 'message' | 'comment' | 'post' = 'message'): ViolationResult {
    if (!content || content.trim().length === 0) {
      return {
        hasViolation: false,
        violations: [],
        severity: 'low',
      };
    }

    const violations: Violation[] = [];
    const normalizedContent = content.toLowerCase();
    const words = normalizedContent.split(/\s+/);
    const contentLength = content.length;

    // Check each violation type
    for (const [type, keywords] of this.violationKeywords.entries()) {
      for (const keyword of keywords) {
        const normalizedKeyword = keyword.toLowerCase();
        const index = normalizedContent.indexOf(normalizedKeyword);

        if (index !== -1) {
          // Extract context around the violation (50 chars before and after)
          const start = Math.max(0, index - 50);
          const end = Math.min(contentLength, index + keyword.length + 50);
          const context = content.substring(start, end);

          violations.push({
            type,
            keyword,
            position: index,
            context: context.trim(),
          });
        }
      }
    }

    // Calculate severity based on violation count and types
    const severity = this.calculateSeverity(violations);

    return {
      hasViolation: violations.length > 0,
      violations,
      severity,
    };
  }

  /**
   * Calculate severity level based on violations
   */
  private calculateSeverity(violations: Violation[]): 'low' | 'medium' | 'high' | 'critical' {
    if (violations.length === 0) {
      return 'low';
    }

    // Count violations by type
    const typeCounts = new Map<string, number>();
    for (const violation of violations) {
      typeCounts.set(violation.type, (typeCounts.get(violation.type) || 0) + 1);
    }

    // Critical: Multiple high-risk violations
    if (
      typeCounts.get(ViolationType.HATE_SPEECH) ||
      typeCounts.get(ViolationType.SCAM) ||
      typeCounts.get(ViolationType.HARASSMENT)
    ) {
      if (violations.length >= 3) {
        return 'critical';
      }
      return 'high';
    }

    // High: Multiple violations or high-risk single violation
    if (violations.length >= 3) {
      return 'high';
    }

    // Medium: 2 violations
    if (violations.length === 2) {
      return 'medium';
    }

    // Low: Single low-risk violation
    return 'low';
  }

  /**
   * Add a new violation keyword to the detection system
   * @param type - Type of violation
   * @param keyword - Keyword to add
   */
  addViolationKeyword(type: ViolationType, keyword: string): void {
    const keywords = this.violationKeywords.get(type) || [];
    if (!keywords.includes(keyword.toLowerCase())) {
      keywords.push(keyword.toLowerCase());
      this.violationKeywords.set(type, keywords);
    }
  }

  /**
   * Remove a violation keyword
   * @param type - Type of violation
   * @param keyword - Keyword to remove
   */
  removeViolationKeyword(type: ViolationType, keyword: string): void {
    const keywords = this.violationKeywords.get(type) || [];
    const filtered = keywords.filter((k) => k !== keyword.toLowerCase());
    this.violationKeywords.set(type, filtered);
  }

  /**
   * Get all violation keywords for a specific type
   * @param type - Type of violation
   * @returns Array of keywords
   */
  getViolationKeywords(type?: ViolationType): Map<ViolationType, string[]> | string[] {
    if (type) {
      return this.violationKeywords.get(type) || [];
    }
    return new Map(this.violationKeywords);
  }

  /**
   * Check if content contains specific violation type
   * @param content - Content to check
   * @param type - Violation type to check for
   * @returns boolean
   */
  hasViolationType(content: string, type: ViolationType): boolean {
    const result = this.scanContent(content);
    return result.violations.some((v) => v.type === type);
  }

  /**
   * Get violation statistics for content
   * @param content - Content to analyze
   * @returns Map of violation types and their counts
   */
  getViolationStats(content: string): Map<string, number> {
    const result = this.scanContent(content);
    const stats = new Map<string, number>();

    for (const violation of result.violations) {
      stats.set(violation.type, (stats.get(violation.type) || 0) + 1);
    }

    return stats;
  }
}

