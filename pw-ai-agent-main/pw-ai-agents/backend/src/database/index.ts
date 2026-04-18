/**
 * Database Configuration and Connection
 */

import logger from '../utils/logger';
import config from '../config';

interface DatabaseConnection {
  isConnected: boolean;
  lastConnected?: Date;
  error?: string;
}

class Database {
  private connection: DatabaseConnection = {
    isConnected: false,
  };

  /**
   * Initialize database connection
   */
  async connect(): Promise<void> {
    try {
      logger.info('Connecting to database', {
        url: config.database.url.split('@')[1], // Mask credentials
      });

      // In production, would use actual database driver (pg, etc.)
      // For now, simulating connection
      await new Promise(resolve => setTimeout(resolve, 500));

      this.connection = {
        isConnected: true,
        lastConnected: new Date(),
      };

      logger.info('Database connection established');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.connection = {
        isConnected: false,
        error: errorMessage,
      };

      logger.error('Database connection failed', errorMessage);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting from database');

      this.connection = {
        isConnected: false,
      };

      logger.info('Database disconnected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error disconnecting from database', errorMessage);
    }
  }

  /**
   * Get connection status
   */
  getStatus(): DatabaseConnection {
    return { ...this.connection };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    // In production, would execute a simple query
    return this.connection.isConnected;
  }
}

export default new Database();
