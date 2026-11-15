/**
 * Serializes async work per key.
 *
 * Calls to `run` with the same key execute one after another, in call order,
 * even if earlier ones reject. Different keys run independently.
 * Used to make read-modify-write sequences (e.g. ID counters) atomic.
 */
export class KeyedLock {
  private tails = new Map<string, Promise<unknown>>();

  run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    const result = previous.then(fn, fn);
    // Keep the chain alive regardless of outcome, and clean up when idle
    const tail = result.catch(() => undefined);
    this.tails.set(key, tail);
    void tail.then(() => {
      if (this.tails.get(key) === tail) {
        this.tails.delete(key);
      }
    });
    return result;
  }
}
