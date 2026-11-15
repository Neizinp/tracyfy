import { describe, it, expect } from 'vitest';
import { KeyedLock } from '../keyedLock';

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('KeyedLock', () => {
  it('runs tasks with the same key sequentially in call order', async () => {
    const lock = new KeyedLock();
    const log: string[] = [];
    await Promise.all([
      lock.run('a', async () => {
        log.push('1-start');
        await tick(20);
        log.push('1-end');
      }),
      lock.run('a', async () => {
        log.push('2-start');
        await tick(1);
        log.push('2-end');
      }),
    ]);
    expect(log).toEqual(['1-start', '1-end', '2-start', '2-end']);
  });

  it('runs tasks with different keys concurrently', async () => {
    const lock = new KeyedLock();
    const log: string[] = [];
    await Promise.all([
      lock.run('a', async () => {
        log.push('a-start');
        await tick(20);
        log.push('a-end');
      }),
      lock.run('b', async () => {
        log.push('b-start');
        log.push('b-end');
      }),
    ]);
    expect(log.indexOf('b-end')).toBeLessThan(log.indexOf('a-end'));
  });

  it('continues the queue after a rejection and propagates the error', async () => {
    const lock = new KeyedLock();
    const failing = lock.run('a', async () => {
      throw new Error('boom');
    });
    const next = lock.run('a', async () => 'ok');
    await expect(failing).rejects.toThrow('boom');
    await expect(next).resolves.toBe('ok');
  });
});
