/**
 * baseArtifactService Observer Pattern Tests
 *
 * Tests for the observer pattern in BaseArtifactService.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseArtifactService } from '../baseArtifactService';
import type { Requirement } from '../../types';

// Create a concrete test service extending BaseArtifactService
class TestArtifactService extends BaseArtifactService<Requirement> {
  protected directory = 'test-artifacts';
  protected prefix = 'TEST';
  protected extension = '.md';

  constructor() {
    super('requirement', {
      serialize: (item) => JSON.stringify(item),
      deserialize: (content) => JSON.parse(content),
    });
  }

  protected toMarkdown(artifact: Requirement): string {
    return `---
id: ${artifact.id}
title: ${artifact.title}
---
`;
  }

  protected parseMarkdown(content: string): Requirement | null {
    const match = content.match(/id: ([\w-]+)/);
    if (!match) return null;
    return {
      id: match[1],
      title: 'Test',
      description: '',
      text: '',
      author: 'Admin',
      priority: 'medium',
      status: 'draft',
      dateCreated: Date.now(),
      lastModified: Date.now(),
      revision: '01',
      rationale: '',
    };
  }

  // Expose protected methods for testing
  public testNotify(): void {
    this.notify();
  }
}

describe('BaseArtifactService Observer Pattern', () => {
  let service: TestArtifactService;

  beforeEach(() => {
    service = new TestArtifactService();
  });

  describe('subscribe', () => {
    it('should allow subscribing to changes', () => {
      const listener = vi.fn();

      const unsubscribe = service.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should return an unsubscribe function', () => {
      const listener = vi.fn();

      const unsubscribe = service.subscribe(listener);

      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('notify', () => {
    it('should call all subscribed listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      service.subscribe(listener1);
      service.subscribe(listener2);

      service.testNotify();

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should not call unsubscribed listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = service.subscribe(listener1);
      service.subscribe(listener2);

      unsubscribe1();
      service.testNotify();

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('unsubscribe', () => {
    it('should remove listener from notifications', () => {
      const listener = vi.fn();

      const unsubscribe = service.subscribe(listener);
      unsubscribe();

      service.testNotify();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should allow re-subscribing after unsubscribe', () => {
      const listener = vi.fn();

      const unsubscribe = service.subscribe(listener);
      unsubscribe();

      service.subscribe(listener);
      service.testNotify();

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('multiple subscriptions', () => {
    it('should handle multiple listeners correctly', () => {
      const listeners = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];
      const unsubscribes = listeners.map((l) => service.subscribe(l));

      service.testNotify();

      listeners.forEach((l) => expect(l).toHaveBeenCalledTimes(1));

      // Unsubscribe some
      unsubscribes[1]();
      unsubscribes[3]();

      service.testNotify();

      expect(listeners[0]).toHaveBeenCalledTimes(2);
      expect(listeners[1]).toHaveBeenCalledTimes(1); // Unsubscribed
      expect(listeners[2]).toHaveBeenCalledTimes(2);
      expect(listeners[3]).toHaveBeenCalledTimes(1); // Unsubscribed
      expect(listeners[4]).toHaveBeenCalledTimes(2);
    });
  });
});
