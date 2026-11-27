// Scheduled Crawler Service for Regular SEO Monitoring
import { RobotCrawler, SitemapCrawler, CrawlResult } from './robotCrawler';
import { trackEvent, GA_EVENTS } from './analytics';

export interface CrawlSchedule {
  id: string;
  name: string;
  type: 'sitemap' | 'custom';
  cron: string;
  maxPages: number;
  delay: number;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  results?: CrawlResult[];
}

export class ScheduledCrawler {
  private schedules: Map<string, CrawlSchedule> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {
    this.initializeDefaultSchedules();
  }

  // Initialize default crawl schedules
  private initializeDefaultSchedules() {
    const defaultSchedules: CrawlSchedule[] = [
      {
        id: 'daily-sitemap',
        name: 'Daily Sitemap Crawl',
        type: 'sitemap',
        cron: '0 2 * * *', // 2 AM daily
        maxPages: 50,
        delay: 1000,
        enabled: true,
      },
      {
        id: 'weekly-full',
        name: 'Weekly Full Crawl',
        type: 'sitemap',
        cron: '0 3 * * 0', // 3 AM every Sunday
        maxPages: 100,
        delay: 500,
        enabled: true,
      },
      {
        id: 'hourly-check',
        name: 'Hourly Health Check',
        type: 'sitemap',
        cron: '0 * * * *', // Every hour
        maxPages: 10,
        delay: 2000,
        enabled: true,
      },
    ];

    defaultSchedules.forEach(schedule => {
      this.schedules.set(schedule.id, schedule);
    });
  }

  // Start scheduled crawling
  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduled crawler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting scheduled crawler service...');

    // Start each enabled schedule
    this.schedules.forEach((schedule, id) => {
      if (schedule.enabled) {
        this.startSchedule(id);
      }
    });

    trackEvent(GA_EVENTS.CONTENT_VIEW, {
      content_type: 'scheduled_crawler_start',
      schedules_count: this.schedules.size,
    });
  }

  // Stop scheduled crawling
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduled crawler is not running');
      return;
    }

    this.isRunning = false;
    console.log('🛑 Stopping scheduled crawler service...');

    // Clear all intervals
    this.intervals.forEach((interval, id) => {
      clearInterval(interval);
      console.log(`✅ Stopped schedule: ${id}`);
    });
    this.intervals.clear();

    trackEvent(GA_EVENTS.CONTENT_VIEW, {
      content_type: 'scheduled_crawler_stop',
    });
  }

  // Start a specific schedule
  private startSchedule(scheduleId: string) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || !schedule.enabled) {
      return;
    }

    console.log(`⏰ Starting schedule: ${schedule.name} (${schedule.cron})`);

    // Calculate next run time (simplified cron parsing)
    const nextRun = this.calculateNextRun(schedule.cron);
    schedule.nextRun = nextRun;

    // Set up interval (simplified - in production use a proper cron library)
    const intervalMs = this.getIntervalMs(schedule.cron);
    const interval = setInterval(async () => {
      await this.runSchedule(scheduleId);
    }, intervalMs);

    this.intervals.set(scheduleId, interval);
  }

  // Run a specific schedule
  private async runSchedule(scheduleId: string) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || !schedule.enabled) {
      return;
    }

    console.log(`🔄 Running schedule: ${schedule.name}`);
    schedule.lastRun = new Date();

    try {
      let crawler: RobotCrawler | SitemapCrawler;
      let results: CrawlResult[] = [];

      if (schedule.type === 'sitemap') {
        const sitemapCrawler = new SitemapCrawler({
          maxPages: schedule.maxPages,
          delay: schedule.delay,
          followExternalLinks: false,
        });
        results = await sitemapCrawler.startSitemapCrawling();
        crawler = sitemapCrawler;
      } else {
        const robotCrawler = new RobotCrawler({
          maxPages: schedule.maxPages,
          delay: schedule.delay,
          followExternalLinks: false,
        });
        results = await robotCrawler.startCrawling();
        crawler = robotCrawler;
      }

      schedule.results = results;
      const stats = crawler.getStats();

      console.log(`✅ Schedule ${schedule.name} completed:`, {
        pages: stats.totalPages,
        avgLoadTime: stats.avgLoadTime,
        avgSeoScore: stats.avgSeoScore,
      });

      // Track successful crawl
      trackEvent(GA_EVENTS.CONTENT_VIEW, {
        content_type: 'scheduled_crawl_complete',
        schedule_id: scheduleId,
        schedule_name: schedule.name,
        pages_crawled: stats.totalPages,
        avg_load_time: stats.avgLoadTime,
        avg_seo_score: stats.avgSeoScore,
      });

      // Check for SEO issues
      this.checkSeoIssues(results, scheduleId);

    } catch (error) {
      console.error(`❌ Schedule ${schedule.name} failed:`, error);
      
      trackEvent(GA_EVENTS.ERROR_OCCURRED, {
        error_type: 'scheduled_crawl_error',
        schedule_id: scheduleId,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Check for SEO issues
  private checkSeoIssues(results: CrawlResult[], scheduleId: string) {
    const issues: string[] = [];

    results.forEach(result => {
      // Check for missing titles
      if (!result.title || result.title.length < 30) {
        issues.push(`Missing or short title: ${result.url}`);
      }

      // Check for missing descriptions
      if (!result.description || result.description.length < 120) {
        issues.push(`Missing or short description: ${result.url}`);
      }

      // Check for missing H1
      if (result.h1.length === 0) {
        issues.push(`Missing H1 tag: ${result.url}`);
      }

      // Check for low SEO score
      if (result.seoScore < 60) {
        issues.push(`Low SEO score (${result.seoScore}): ${result.url}`);
      }

      // Check for slow loading
      if (result.loadTime > 3000) {
        issues.push(`Slow loading (${result.loadTime}ms): ${result.url}`);
      }

      // Check for thin content
      if (result.wordCount < 200) {
        issues.push(`Thin content (${result.wordCount} words): ${result.url}`);
      }
    });

    if (issues.length > 0) {
      console.warn(`⚠️ SEO issues found in schedule ${scheduleId}:`, issues);
      
      trackEvent(GA_EVENTS.ERROR_OCCURRED, {
        error_type: 'seo_issues_detected',
        schedule_id: scheduleId,
        issues_count: issues.length,
        issues: issues.slice(0, 10), // Limit to first 10 issues
      });
    }
  }

  // Add a new schedule
  addSchedule(schedule: CrawlSchedule) {
    this.schedules.set(schedule.id, schedule);
    
    if (this.isRunning && schedule.enabled) {
      this.startSchedule(schedule.id);
    }

    console.log(`➕ Added schedule: ${schedule.name}`);
  }

  // Remove a schedule
  removeSchedule(scheduleId: string) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return;
    }

    // Stop the schedule if running
    const interval = this.intervals.get(scheduleId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(scheduleId);
    }

    this.schedules.delete(scheduleId);
    console.log(`➖ Removed schedule: ${schedule.name}`);
  }

  // Get all schedules
  getSchedules(): CrawlSchedule[] {
    return Array.from(this.schedules.values());
  }

  // Get schedule by ID
  getSchedule(scheduleId: string): CrawlSchedule | undefined {
    return this.schedules.get(scheduleId);
  }

  // Update schedule
  updateSchedule(scheduleId: string, updates: Partial<CrawlSchedule>) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return;
    }

    Object.assign(schedule, updates);

    // Restart schedule if it was running
    if (this.isRunning && schedule.enabled) {
      const interval = this.intervals.get(scheduleId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(scheduleId);
      }
      this.startSchedule(scheduleId);
    }

    console.log(`🔄 Updated schedule: ${schedule.name}`);
  }

  // Get crawl statistics
  getStats() {
    const schedules = Array.from(this.schedules.values());
    const enabledSchedules = schedules.filter(s => s.enabled);
    const totalRuns = schedules.reduce((sum, s) => sum + (s.results?.length || 0), 0);
    const lastRuns = schedules.filter(s => s.lastRun).length;

    return {
      totalSchedules: schedules.length,
      enabledSchedules: enabledSchedules.length,
      totalRuns,
      lastRuns,
      isRunning: this.isRunning,
    };
  }

  // Calculate next run time (simplified)
  private calculateNextRun(cron: string): Date {
    const now = new Date();
    const nextRun = new Date(now);

    // Simple cron parsing (in production, use a proper cron library)
    if (cron === '0 2 * * *') { // Daily at 2 AM
      nextRun.setHours(2, 0, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else if (cron === '0 3 * * 0') { // Weekly on Sunday at 3 AM
      nextRun.setHours(3, 0, 0, 0);
      const daysUntilSunday = (7 - nextRun.getDay()) % 7;
      nextRun.setDate(nextRun.getDate() + daysUntilSunday);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      }
    } else if (cron === '0 * * * *') { // Every hour
      nextRun.setMinutes(0, 0, 0);
      nextRun.setHours(nextRun.getHours() + 1);
    }

    return nextRun;
  }

  // Get interval milliseconds (simplified)
  private getIntervalMs(cron: string): number {
    if (cron === '0 2 * * *') { // Daily
      return 24 * 60 * 60 * 1000;
    } else if (cron === '0 3 * * 0') { // Weekly
      return 7 * 24 * 60 * 60 * 1000;
    } else if (cron === '0 * * * *') { // Hourly
      return 60 * 60 * 1000;
    }
    return 60 * 60 * 1000; // Default to hourly
  }
}

// Export singleton instance
export const scheduledCrawler = new ScheduledCrawler();
