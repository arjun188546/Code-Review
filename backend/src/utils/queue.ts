import Queue from 'bull';
import { config } from '../config';
import { QueueJob } from '../types';

export const queue = new Queue<QueueJob>('code-review', config.redis.url);

export const setupQueue = (analysisService: any) => {
  queue.process('analyze-pr', async (job) => {
    const { owner, repo, prNumber } = job.data;
    await analysisService.analyzePullRequest(owner, repo, prNumber);
  });

  queue.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  queue.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
};
