import { NextRequest, NextResponse } from 'next/server';
import { RobotCrawler, SitemapCrawler, CrawlResult } from '@/lib/robotCrawler';
import { trackEvent, GA_EVENTS } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type = 'sitemap', 
      startUrl, 
      maxPages = 20, 
      delay = 1000,
      followExternalLinks = false 
    } = body;

    console.log('🤖 Starting crawler API request:', { type, startUrl, maxPages });

    // Track crawler start
    trackEvent(GA_EVENTS.CONTENT_VIEW, {
      content_type: 'crawler_api_start',
      crawler_type: type,
      max_pages: maxPages,
    });

    let crawler: RobotCrawler | SitemapCrawler;
    let results: CrawlResult[] = [];

    if (type === 'sitemap') {
      const sitemapCrawler = new SitemapCrawler({
        maxPages,
        delay,
        followExternalLinks,
      });
      results = await sitemapCrawler.startSitemapCrawling();
      crawler = sitemapCrawler;
    } else {
      const robotCrawler = new RobotCrawler({
        maxPages,
        delay,
        followExternalLinks,
      });
      results = await robotCrawler.startCrawling(startUrl);
      crawler = robotCrawler;
    }

    const stats = crawler.getStats();

    // Track crawler completion
    trackEvent(GA_EVENTS.CONTENT_VIEW, {
      content_type: 'crawler_api_complete',
      pages_crawled: stats.totalPages,
      avg_load_time: stats.avgLoadTime,
      avg_seo_score: stats.avgSeoScore,
    });

    return NextResponse.json({
      success: true,
      stats,
      results: results.map(result => ({
        url: result.url,
        title: result.title,
        description: result.description,
        h1: result.h1,
        h2: result.h2,
        h3: result.h3,
        loadTime: result.loadTime,
        wordCount: result.wordCount,
        seoScore: result.seoScore,
        linksCount: result.links.length,
        imagesCount: result.images.length,
        timestamp: result.timestamp,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Crawler API error:', error);
    
    trackEvent(GA_EVENTS.ERROR_OCCURRED, {
      error_type: 'crawler_api_error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sitemap';
    const maxPages = parseInt(searchParams.get('maxPages') || '10');
    const delay = parseInt(searchParams.get('delay') || '1000');

    console.log('🤖 Starting crawler GET request:', { type, maxPages, delay });

    let crawler: RobotCrawler | SitemapCrawler;
    let results: CrawlResult[] = [];

    if (type === 'sitemap') {
      const sitemapCrawler = new SitemapCrawler({
        maxPages,
        delay,
        followExternalLinks: false,
      });
      results = await sitemapCrawler.startSitemapCrawling();
      crawler = sitemapCrawler;
    } else {
      const robotCrawler = new RobotCrawler({
        maxPages,
        delay,
        followExternalLinks: false,
      });
      results = await robotCrawler.startCrawling();
      crawler = robotCrawler;
    }

    const stats = crawler.getStats();

    return NextResponse.json({
      success: true,
      stats,
      results: results.map(result => ({
        url: result.url,
        title: result.title,
        description: result.description,
        seoScore: result.seoScore,
        loadTime: result.loadTime,
        wordCount: result.wordCount,
        linksCount: result.links.length,
        imagesCount: result.images.length,
      })),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Crawler GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
