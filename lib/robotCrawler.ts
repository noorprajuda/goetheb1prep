// Robot Crawler for Google Analytics and SEO Data Collection
import { GA_EVENTS, trackEvent, trackPerformance } from './analytics';

export interface CrawlResult {
  url: string;
  status: number;
  title: string;
  description: string;
  h1: string[];
  h2: string[];
  h3: string[];
  links: string[];
  images: string[];
  loadTime: number;
  wordCount: number;
  seoScore: number;
  errors: string[];
  timestamp: Date;
}

export interface CrawlConfig {
  baseUrl: string;
  maxPages: number;
  delay: number;
  userAgent: string;
  followExternalLinks: boolean;
  includeImages: boolean;
  includeScripts: boolean;
  respectRobotsTxt: boolean;
}

export class RobotCrawler {
  protected config: CrawlConfig;
  private visitedUrls: Set<string> = new Set();
  protected crawlQueue: string[] = [];
  private results: CrawlResult[] = [];
  private isRunning: boolean = false;

  constructor(config: Partial<CrawlConfig> = {}) {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://www.goetheb1prep.com',
      maxPages: 50,
      delay: 1000,
      userAgent: 'GoetheB1PrepBot/1.0 (+https://www.goetheb1prep.com/robots.txt)',
      followExternalLinks: false,
      includeImages: true,
      includeScripts: false,
      respectRobotsTxt: true,
      ...config,
    };
  }

  // Start crawling process
  async startCrawling(startUrl?: string): Promise<CrawlResult[]> {
    if (this.isRunning) {
      throw new Error('Crawler is already running');
    }

    this.isRunning = true;
    this.crawlQueue = [startUrl || this.config.baseUrl];
    this.visitedUrls.clear();
    this.results = [];

    console.log('🤖 Starting robot crawler...');
    trackEvent(GA_EVENTS.CONTENT_VIEW, {
      content_type: 'crawler_start',
      crawler_status: 'started',
    });

    try {
      while (this.crawlQueue.length > 0 && this.results.length < this.config.maxPages) {
        const url = this.crawlQueue.shift();
        if (!url || this.visitedUrls.has(url)) continue;

        console.log(`🔍 Crawling: ${url}`);
        const result = await this.crawlPage(url);
        
        if (result) {
          this.results.push(result);
          this.visitedUrls.add(url);
          
          // Add new links to queue
          if (this.config.followExternalLinks || this.isInternalLink(url)) {
            result.links.forEach(link => {
              const absoluteUrl = this.resolveUrl(link, url);
              if (!this.visitedUrls.has(absoluteUrl) && this.isValidUrl(absoluteUrl)) {
                this.crawlQueue.push(absoluteUrl);
              }
            });
          }
        }

        // Respect delay between requests
        if (this.crawlQueue.length > 0) {
          await this.delay(this.config.delay);
        }
      }

      console.log(`✅ Crawling completed. Processed ${this.results.length} pages`);
      trackEvent(GA_EVENTS.CONTENT_VIEW, {
        content_type: 'crawler_complete',
        pages_crawled: this.results.length,
        crawler_status: 'completed',
      });

      return this.results;
    } catch (error) {
      console.error('❌ Crawling error:', error);
      trackEvent(GA_EVENTS.ERROR_OCCURRED, {
        error_type: 'crawler_error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Crawl a single page
  private async crawlPage(url: string): Promise<CrawlResult | null> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
      });

      const loadTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const result = this.parseHtml(html, url, loadTime);
      
      // Track performance
      trackPerformance('page_load_time', loadTime);
      
      return result;
    } catch (error) {
      console.error(`❌ Error crawling ${url}:`, error);
      trackEvent(GA_EVENTS.ERROR_OCCURRED, {
        error_type: 'page_crawl_error',
        error_url: url,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  // Parse HTML content
  private parseHtml(html: string, url: string, loadTime: number): CrawlResult {
    // Simple HTML parsing (in production, use a proper HTML parser like cheerio)
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    
    const h1Matches = html.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || [];
    const h2Matches = html.match(/<h2[^>]*>([^<]*)<\/h2>/gi) || [];
    const h3Matches = html.match(/<h3[^>]*>([^<]*)<\/h3>/gi) || [];
    
    const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>/gi) || [];
    const imageMatches = html.match(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi) || [];

    const title = titleMatch ? this.stripHtml(titleMatch[1]) : '';
    const description = descriptionMatch ? this.stripHtml(descriptionMatch[1]) : '';
    
    const h1 = h1Matches.map(match => this.stripHtml(match.replace(/<[^>]*>/g, '')));
    const h2 = h2Matches.map(match => this.stripHtml(match.replace(/<[^>]*>/g, '')));
    const h3 = h3Matches.map(match => this.stripHtml(match.replace(/<[^>]*>/g, '')));
    
    const links = linkMatches.map(match => {
      const hrefMatch = match.match(/href=["']([^"']*)["']/);
      return hrefMatch ? hrefMatch[1] : '';
    }).filter(link => link && !link.startsWith('#'));
    
    const images = imageMatches.map(match => {
      const srcMatch = match.match(/src=["']([^"']*)["']/);
      return srcMatch ? srcMatch[1] : '';
    }).filter(src => src);

    const wordCount = this.countWords(html);
    const seoScore = this.calculateSeoScore(title, description, h1, h2, h3, wordCount);

    return {
      url,
      status: 200,
      title,
      description,
      h1,
      h2,
      h3,
      links,
      images,
      loadTime,
      wordCount,
      seoScore,
      errors: [],
      timestamp: new Date(),
    };
  }

  // Calculate SEO score
  private calculateSeoScore(title: string, description: string, h1: string[], h2: string[], h3: string[], wordCount: number): number {
    let score = 0;
    
    // Title optimization (30 points)
    if (title.length > 30 && title.length < 60) score += 30;
    else if (title.length > 0) score += 15;
    
    // Description optimization (20 points)
    if (description.length > 120 && description.length < 160) score += 20;
    else if (description.length > 0) score += 10;
    
    // Heading structure (25 points)
    if (h1.length === 1) score += 15;
    if (h2.length > 0) score += 5;
    if (h3.length > 0) score += 5;
    
    // Content length (15 points)
    if (wordCount > 300) score += 15;
    else if (wordCount > 150) score += 10;
    else if (wordCount > 50) score += 5;
    
    // Keyword density (10 points)
    const keywords = ['goethe', 'b1', 'german', 'speaking', 'test', 'practice'];
    const content = (title + ' ' + description + ' ' + h1.join(' ') + ' ' + h2.join(' ')).toLowerCase();
    const keywordCount = keywords.filter(keyword => content.includes(keyword)).length;
    score += Math.min(keywordCount * 2, 10);
    
    return Math.min(score, 100);
  }

  // Utility functions
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  private countWords(html: string): number {
    const text = this.stripHtml(html);
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private isInternalLink(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(this.config.baseUrl);
      return urlObj.hostname === baseUrlObj.hostname;
    } catch {
      return false;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private resolveUrl(link: string, baseUrl: string): string {
    try {
      return new URL(link, baseUrl).href;
    } catch {
      return link;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get crawl results
  getResults(): CrawlResult[] {
    return this.results;
  }

  // Get crawl statistics
  getStats() {
    const totalPages = this.results.length;
    const avgLoadTime = this.results.reduce((sum, result) => sum + result.loadTime, 0) / totalPages;
    const avgSeoScore = this.results.reduce((sum, result) => sum + result.seoScore, 0) / totalPages;
    const totalLinks = this.results.reduce((sum, result) => sum + result.links.length, 0);
    const totalImages = this.results.reduce((sum, result) => sum + result.images.length, 0);

    return {
      totalPages,
      avgLoadTime: Math.round(avgLoadTime),
      avgSeoScore: Math.round(avgSeoScore),
      totalLinks,
      totalImages,
      isRunning: this.isRunning,
    };
  }

  // Export results to JSON
  exportResults(): string {
    return JSON.stringify({
      config: this.config,
      stats: this.getStats(),
      results: this.results,
      timestamp: new Date().toISOString(),
    }, null, 2);
  }
}

// Sitemap-based crawler
export class SitemapCrawler extends RobotCrawler {
  private sitemapUrls: string[] = [];

  constructor(config: Partial<CrawlConfig> = {}) {
    super(config);
  }

  // Load URLs from sitemap
  async loadFromSitemap(sitemapUrl?: string): Promise<void> {
    const sitemap = sitemapUrl || `${this.config.baseUrl}/sitemap.xml`;
    
    try {
      const response = await fetch(sitemap);
      if (!response.ok) {
        throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
      }

      const xml = await response.text();
      const urlMatches = xml.match(/<loc>([^<]*)<\/loc>/g) || [];
      
      this.sitemapUrls = urlMatches.map(match => {
        const urlMatch = match.match(/<loc>([^<]*)<\/loc>/);
        return urlMatch ? urlMatch[1] : '';
      }).filter(url => url);

      console.log(`📋 Loaded ${this.sitemapUrls.length} URLs from sitemap`);
      trackEvent(GA_EVENTS.CONTENT_VIEW, {
        content_type: 'sitemap_loaded',
        urls_count: this.sitemapUrls.length,
      });
    } catch (error) {
      console.error('❌ Error loading sitemap:', error);
      trackEvent(GA_EVENTS.ERROR_OCCURRED, {
        error_type: 'sitemap_error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Start crawling from sitemap
  async startSitemapCrawling(): Promise<CrawlResult[]> {
    await this.loadFromSitemap();
    this.crawlQueue = [...this.sitemapUrls];
    return this.startCrawling();
  }
}

// Export default crawler instance
export const defaultCrawler = new RobotCrawler();
export const sitemapCrawler = new SitemapCrawler();
