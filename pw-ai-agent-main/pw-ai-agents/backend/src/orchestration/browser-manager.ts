/**
 * Browser Manager
 * Manages browser instances and context lifecycle
 */

import { BrowserPoolState, Browser } from '../types';
import logger from '../utils/logger';
import config from '../config';

interface BrowserInstance {
  id: string;
  type: Browser;
  inUse: boolean;
  createdAt: Date;
}

export class BrowserManager {
  private browserPool: BrowserInstance[] = [];
  private maxInstances = config.test.maxParallelWorkers;
  private waitingQueue: string[] = [];

  /**
   * Allocate a browser instance
   */
  async allocateBrowser(type: Browser): Promise<string> {
    logger.info('Allocating browser', { type });

    // Check for available browser
    const available = this.browserPool.find(
      b => !b.inUse && b.type === type
    );

    if (available) {
      available.inUse = true;
      logger.info('Reusing browser instance', { browserId: available.id, type });
      return available.id;
    }

    // Create new instance if under limit
    if (this.browserPool.length < this.maxInstances) {
      const instance: BrowserInstance = {
        id: `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        inUse: true,
        createdAt: new Date(),
      };

      this.browserPool.push(instance);
      logger.info('Created new browser instance', { browserId: instance.id, type });
      return instance.id;
    }

    // Queue request if at capacity
    return new Promise((resolve) => {
      const queueId = `queue-${Date.now()}`;
      this.waitingQueue.push(queueId);
      logger.warn('Browser pool at capacity, queueing request', { queueId });

      // Wait for available browser with timeout
      const timeout = setTimeout(() => {
        this.waitingQueue = this.waitingQueue.filter(id => id !== queueId);
        // Create new instance even if over limit (emergency)
        const emergency: BrowserInstance = {
          id: `browser-emergency-${Date.now()}`,
          type,
          inUse: true,
          createdAt: new Date(),
        };
        this.browserPool.push(emergency);
        resolve(emergency.id);
      }, config.test.timeout);

      // Try to find available browser
      const checkInterval = setInterval(() => {
        const available = this.browserPool.find(
          b => !b.inUse && b.type === type
        );

        if (available) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          available.inUse = true;
          this.waitingQueue = this.waitingQueue.filter(id => id !== queueId);
          resolve(available.id);
        }
      }, 100);
    });
  }

  /**
   * Release a browser instance
   */
  async releaseBrowser(browserId: string): Promise<void> {
    const browser = this.browserPool.find(b => b.id === browserId);

    if (!browser) {
      logger.warn('Attempted to release unknown browser', { browserId });
      return;
    }

    browser.inUse = false;
    logger.info('Browser released', { browserId });
  }

  /**
   * Get pool state
   */
  getPoolState(): BrowserPoolState {
    return {
      maxInstances: this.maxInstances,
      allocatedInstances: this.browserPool.filter(b => b.inUse).length,
      waitingQueue: this.waitingQueue,
      availableBrowsers: this.browserPool.filter(b => !b.inUse).length,
    };
  }

  /**
   * Clean up all browser instances
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up browser pool', {
      instanceCount: this.browserPool.length,
    });

    // In production, would close actual browser instances here
    this.browserPool = [];
    this.waitingQueue = [];
  }

  /**
   * Get browser pool metrics
   */
  getMetrics() {
    const poolState = this.getPoolState();
    return {
      totalInstances: this.browserPool.length,
      activeInstances: poolState.allocatedInstances,
      idleInstances: poolState.availableBrowsers,
      queuedRequests: poolState.waitingQueue.length,
      utilizationRate: (poolState.allocatedInstances / this.maxInstances) * 100,
    };
  }
}

export default new BrowserManager();
