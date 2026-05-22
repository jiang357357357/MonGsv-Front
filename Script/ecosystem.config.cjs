const path = require('path');

module.exports = {
  apps: [{
    name: "MonGsvFront",
    script: "./start.sh",
    args: "prod",
    interpreter: "none",
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production"
    },
    error_file: path.join(__dirname, "logs/error.log"),
    out_file: path.join(__dirname, "logs/out.log"),
    log_date_format: "YYYY-MM-DD HH:mm:ss"
  }]
}
