import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useInformation } from '../useInformation';
import type { Information } from '../../types';

describe('useInformation', () => {
  let mockInformation: Information[];
  let mockSetInformation: ReturnType<typeof vi.fn>;
  let mockSetUsedInfoNumbers: ReturnType<typeof vi.fn>;
  let mockSetIsInformationModalOpen: ReturnType<typeof vi.fn>;
  let mockSetSelectedInformation: ReturnType<typeof vi.fn>;
  let mockSaveArtifact: ReturnType<typeof vi.fn>;
  let mockDeleteArtifact: ReturnType<typeof vi.fn>;
  let usedInfoNumbers: Set<number>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInformation = [
      {
        id: 'INFO-001',
        title: 'Test Information',
        content: 'Test Content',
        type: 'note',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
        linkedArtifacts: [],
        isDeleted: false,
      },
    ];
    usedInfoNumbers = new Set([1]);
    mockSetInformation = vi.fn();
    mockSetUsedInfoNumbers = vi.fn();
    mockSetIsInformationModalOpen = vi.fn();
    mockSetSelectedInformation = vi.fn();
    mockSaveArtifact = vi.fn().mockResolvedValue(undefined);
    mockDeleteArtifact = vi.fn().mockResolvedValue(undefined);
  });

  const useTestHook = () =>
    useInformation({
      information: mockInformation,
      setInformation: mockSetInformation as any,
      usedInfoNumbers,
      setUsedInfoNumbers: mockSetUsedInfoNumbers as any,
      setIsInformationModalOpen: mockSetIsInformationModalOpen as any,
      setSelectedInformation: mockSetSelectedInformation as any,
      saveArtifact: mockSaveArtifact as any,
      deleteArtifact: mockDeleteArtifact as any,
    });

  describe('handleAddInformation', () => {
    it('should add new information with generated ID', async () => {
      const hook = useTestHook();

      await hook.handleAddInformation({
        title: 'New Information',
        content: 'New Content',
        type: 'note',
        revision: '01',
        linkedArtifacts: [],
      });

      expect(mockSetInformation).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'INFO-002',
            title: 'New Information',
            content: 'New Content',
            type: 'note',
          }),
        ])
      );
      expect(mockSetUsedInfoNumbers).toHaveBeenCalled();
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'information',
        'INFO-002',
        expect.objectContaining({
          id: 'INFO-002',
          title: 'New Information',
        })
      );
      expect(mockSetIsInformationModalOpen).toHaveBeenCalledWith(false);
    });

    it('should set dateCreated and lastModified timestamps on new info', async () => {
      const hook = useTestHook();
      const beforeTime = Date.now();

      await hook.handleAddInformation({
        title: 'New Information',
        content: 'Content',
        type: 'note',
        revision: '01',
        linkedArtifacts: [],
      });

      const afterTime = Date.now();
      const savedInfo = mockSaveArtifact.mock.calls[0][2] as Information;
      expect(savedInfo.dateCreated).toBeGreaterThanOrEqual(beforeTime);
      expect(savedInfo.dateCreated).toBeLessThanOrEqual(afterTime);
      expect(savedInfo.lastModified).toBeGreaterThanOrEqual(beforeTime);
      expect(savedInfo.lastModified).toBeLessThanOrEqual(afterTime);
    });

    it('should update existing information when id is provided', async () => {
      const hook = useTestHook();

      await hook.handleAddInformation({
        id: 'INFO-001',
        updates: {
          title: 'Updated Title',
          content: 'Updated Content',
        },
      });

      expect(mockSetInformation).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'information',
        'INFO-001',
        expect.objectContaining({
          id: 'INFO-001',
          title: 'Updated Title',
          content: 'Updated Content',
          revision: '02',
        })
      );
      expect(mockSetSelectedInformation).toHaveBeenCalledWith(null);
    });

    it('should increment revision on update', async () => {
      const hook = useTestHook();

      await hook.handleAddInformation({
        id: 'INFO-001',
        updates: { title: 'Updated' },
      });

      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'information',
        'INFO-001',
        expect.objectContaining({
          revision: '02',
        })
      );
    });

    it('should not update if information not found', async () => {
      const hook = useTestHook();

      await hook.handleAddInformation({
        id: 'INFO-999',
        updates: { title: 'Updated' },
      });

      expect(mockSetInformation).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSaveArtifact.mockRejectedValue(new Error('Save failed'));

      const hook = useTestHook();

      await hook.handleAddInformation({
        title: 'New Information',
        content: '',
        type: 'note',
        revision: '01',
        linkedArtifacts: [],
      });

      expect(consoleError).toHaveBeenCalledWith('Failed to save information:', expect.any(Error));
      consoleError.mockRestore();
    });
  });

  describe('handleEditInformation', () => {
    it('should set selected information and open modal', () => {
      const hook = useTestHook();

      hook.handleEditInformation(mockInformation[0]);

      expect(mockSetSelectedInformation).toHaveBeenCalledWith(mockInformation[0]);
      expect(mockSetIsInformationModalOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDeleteInformation', () => {
    it('should soft delete information', () => {
      const hook = useTestHook();

      hook.handleDeleteInformation('INFO-001');

      expect(mockSetInformation).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'INFO-001',
            isDeleted: true,
            deletedAt: expect.any(Number),
          }),
        ])
      );
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'information',
        'INFO-001',
        expect.objectContaining({
          isDeleted: true,
          deletedAt: expect.any(Number),
        })
      );
    });

    it('should not delete if information not found', () => {
      const hook = useTestHook();

      hook.handleDeleteInformation('INFO-999');

      expect(mockSetInformation).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSaveArtifact.mockRejectedValue(new Error('Save failed'));

      const hook = useTestHook();

      await hook.handleDeleteInformation('INFO-001');

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to save deleted information:',
        expect.any(Error)
      );
      consoleError.mockRestore();
    });
  });

  describe('handleRestoreInformation', () => {
    it('should restore soft-deleted information', () => {
      mockInformation[0].isDeleted = true;
      mockInformation[0].deletedAt = Date.now();

      const hook = useTestHook();

      hook.handleRestoreInformation('INFO-001');

      expect(mockSetInformation).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSaveArtifact).toHaveBeenCalledWith(
        'information',
        'INFO-001',
        expect.objectContaining({
          isDeleted: false,
          deletedAt: undefined,
        })
      );
    });

    it('should not restore if information not found', () => {
      const hook = useTestHook();

      hook.handleRestoreInformation('INFO-999');

      expect(mockSetInformation).not.toHaveBeenCalled();
      expect(mockSaveArtifact).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockSaveArtifact.mockRejectedValue(new Error('Save failed'));

      const hook = useTestHook();

      await hook.handleRestoreInformation('INFO-001');

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to save restored information:',
        expect.any(Error)
      );
      consoleError.mockRestore();
    });
  });

  describe('handlePermanentDeleteInformation', () => {
    it('should permanently delete information', () => {
      const hook = useTestHook();

      hook.handlePermanentDeleteInformation('INFO-001');

      expect(mockSetInformation).toHaveBeenCalledWith(expect.any(Function));
      expect(mockDeleteArtifact).toHaveBeenCalledWith('information', 'INFO-001');
    });

    it('should remove information from array', () => {
      let capturedUpdater: any;
      mockSetInformation.mockImplementation((updater) => {
        capturedUpdater = updater;
      });

      const hook = useTestHook();

      hook.handlePermanentDeleteInformation('INFO-001');

      const result = capturedUpdater(mockInformation);
      expect(result).toEqual([]);
    });

    it('should handle delete errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockDeleteArtifact.mockRejectedValue(new Error('Delete failed'));

      const hook = useTestHook();

      await hook.handlePermanentDeleteInformation('INFO-001');

      expect(consoleError).toHaveBeenCalledWith('Failed to delete information:', expect.any(Error));
      consoleError.mockRestore();
    });
  });
});
