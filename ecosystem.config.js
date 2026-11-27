module.exports = {
  apps: [
    {
      name: "goethe-b1-prep",
      script: "npm",
      args: "start",
      cwd: "/path/to/your/project", // Update this path
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "audio-cleanup",
      script: "scripts/scheduled-audio-cleanup.js",
      instances: 1,
      autorestart: false,
      watch: false,
      cron_restart: "0 * * * *", // Run every hour
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
