require('dotenv').config(); 

module.exports = {
    apps: [
      {
        name: "unlockstartup", 
        script: "server.js",
        // script: "index.js",
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: "1G",
        env: {
          NODE_ENV: "production",
          MONGO_URL: process.env.MONGO_URL,
          ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET
        },
        env_production: {
          NODE_ENV: "production",
          MONGO_URL: process.env.MONGO_URL,
          ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET
        }
      }
    ]
  };
  