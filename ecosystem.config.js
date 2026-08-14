module.exports = {
  apps: [
    {
      name: "dealsrewards-backend",
      cwd: "./backend",
      script: "src/index.js",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "dealsrewards-frontend",
      cwd: "./frontend",
      script: "npx",
      args: "serve -s build -l 5173",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
