/**
 * CRON JOB UTILITY
 * =================
 * Scheduled tasks to keep the server alive on Render
 * Calls health endpoint every 10 minutes to prevent shutdown
 */

const cron = require('node-cron');
const axios = require('axios');

class CronManager {
  constructor() {
    this.isRunning = false;
    // Use RENDER_EXTERNAL_URL for Render deployments, fallback to localhost for development
    this.baseURL = process.env.RENDER_EXTERNAL_URL ||
                   process.env.BASE_URL ||
                   'http://localhost:5000';
    this.jobs = [];
  }

  /**
   * Initialize all CRON jobs
   */
  init() {
    if (this.isRunning) {
      console.log('🔄 CRON jobs already running');
      return;
    }

    // Only run CRON jobs in production (Render)
    if (process.env.NODE_ENV === 'production') {
      this.startHealthCheckJob();
      this.isRunning = true;
      console.log('⏰ CRON jobs initialized for production environment');
    } else {
      console.log('⏰ CRON jobs skipped (not in production)');
    }
  }

  /**
   * Start health check job - runs every 10 minutes
   */
  startHealthCheckJob() {
    const job = cron.schedule('*/10 * * * *', async () => {
      try {
        const response = await axios.get(`${this.baseURL}/api/health`, {
          timeout: 10000, // 10 second timeout
        });

        if (response.status === 200) {
          console.log(`✅ Health check successful at ${new Date().toISOString()}`);
          console.log(`   📊 Uptime: ${response.data.uptime}s`);
          console.log(`   🗄️  Database: ${response.data.database}`);
        }
      } catch (error) {
        console.error(`❌ Health check failed at ${new Date().toISOString()}:`, error.message);
      }
    }, {
      scheduled: false, // Don't start immediately
    });

    // Start the job
    job.start();
    this.jobs.push(job);

    console.log('🏥 Health check CRON job scheduled: Every 10 minutes');
    console.log('   📅 CRON expression: */10 * * * *');
  }

  /**
   * Stop all CRON jobs
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    this.isRunning = false;
    console.log('⏹️  All CRON jobs stopped');
  }

  /**
   * Get status of CRON jobs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      environment: process.env.NODE_ENV,
      baseURL: this.baseURL,
      jobCount: this.jobs.length,
      jobs: this.jobs.map((job, index) => ({
        id: index + 1,
        running: job.running,
        scheduled: job.scheduled,
      }))
    };
  }
}

// Export singleton instance
module.exports = new CronManager();