module.exports = {
  apps: [
    {
      name: "gyra",
      cwd: "/root/gyra",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3110",
      env: { NODE_ENV: "production" },
      max_restarts: 10,
      restart_delay: 3000,
      out_file: "/root/gyra/.logs/gyra-out.log",
      error_file: "/root/gyra/.logs/gyra-error.log",
    },
    {
      name: "gyra-jwt-adapter",
      cwd: "/root/gyra",
      script: "/root/gyra/stack/jwt-adapter.mjs",
      env: { NODE_ENV: "production" },
      max_restarts: 50,
      restart_delay: 2000,
      out_file: "/root/gyra/.logs/gyra-adapter-out.log",
      error_file: "/root/gyra/.logs/gyra-adapter-error.log",
    },
  ],
};
