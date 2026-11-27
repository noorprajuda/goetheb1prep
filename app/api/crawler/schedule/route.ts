import { NextRequest, NextResponse } from 'next/server';
import { scheduledCrawler } from '@/lib/scheduledCrawler';
import { trackEvent, GA_EVENTS } from '@/lib/analytics';

// GET - Get all schedules and stats
export async function GET() {
  try {
    const schedules = scheduledCrawler.getSchedules();
    const stats = scheduledCrawler.getStats();

    return NextResponse.json({
      success: true,
      stats,
      schedules,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error getting schedules:', error);
    
    trackEvent(GA_EVENTS.ERROR_OCCURRED, {
      error_type: 'schedule_get_error',
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

// POST - Add or update a schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, schedule } = body;

    if (action === 'add' && schedule) {
      scheduledCrawler.addSchedule(schedule);
      
      trackEvent(GA_EVENTS.CONTENT_VIEW, {
        content_type: 'schedule_added',
        schedule_id: schedule.id,
        schedule_name: schedule.name,
      });

      return NextResponse.json({
        success: true,
        message: `Schedule ${schedule.name} added successfully`,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'update' && schedule?.id) {
      scheduledCrawler.updateSchedule(schedule.id, schedule);
      
      trackEvent(GA_EVENTS.CONTENT_VIEW, {
        content_type: 'schedule_updated',
        schedule_id: schedule.id,
        schedule_name: schedule.name,
      });

      return NextResponse.json({
        success: true,
        message: `Schedule ${schedule.id} updated successfully`,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'start') {
      scheduledCrawler.start();
      
      trackEvent(GA_EVENTS.CONTENT_VIEW, {
        content_type: 'scheduled_crawler_started',
      });

      return NextResponse.json({
        success: true,
        message: 'Scheduled crawler started successfully',
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'stop') {
      scheduledCrawler.stop();
      
      trackEvent(GA_EVENTS.CONTENT_VIEW, {
        content_type: 'scheduled_crawler_stopped',
      });

      return NextResponse.json({
        success: true,
        message: 'Scheduled crawler stopped successfully',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid action or missing schedule data',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error managing schedules:', error);
    
    trackEvent(GA_EVENTS.ERROR_OCCURRED, {
      error_type: 'schedule_manage_error',
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

// DELETE - Remove a schedule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('id');

    if (!scheduleId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Schedule ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const schedule = scheduledCrawler.getSchedule(scheduleId);
    if (!schedule) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Schedule not found',
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    scheduledCrawler.removeSchedule(scheduleId);
    
    trackEvent(GA_EVENTS.CONTENT_VIEW, {
      content_type: 'schedule_removed',
      schedule_id: scheduleId,
      schedule_name: schedule.name,
    });

    return NextResponse.json({
      success: true,
      message: `Schedule ${schedule.name} removed successfully`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error removing schedule:', error);
    
    trackEvent(GA_EVENTS.ERROR_OCCURRED, {
      error_type: 'schedule_remove_error',
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
