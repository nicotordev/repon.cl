type HealthStatus = {
  status: string;
  uptime: number;
  timestamp: string;
  platform: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  nodeVersion: string;
  cpuUsage: {
    user: number;
    system: number;
  };
  env: string;
};

const miscService = {
  /**
   * Retrieves the current health status of the server.
   * @returns {Promise<HealthStatus>} The health status object.
   */
  async getHealth(): Promise<HealthStatus> {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      cpuUsage: process.cpuUsage(),
      env: process.env.NODE_ENV || "development",
    };
  },
};

export default miscService;
