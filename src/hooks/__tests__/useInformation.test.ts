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
    mockInformation = [
      {
        id: 'INFO-001',
        title: 'Test Information',
        content: 'Test Content',
        type: 'note',
        revision: '01',
        dateCreated: 1000000,
        lastModified: 1000000,
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

  const createHook = () =>
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
      const hook = createHook();

      await hook.handleAddInformation({
        title: 'New Information',
        content: 'New Content',
        type: 'note',
        revision: '01',
      });

      expect(mockSetInformation).toHaveBeenCalled();
      expect(mockSetUsedInfoNumbers).toHaveBeenCalled();
      expect(mockSetIsInformationModalOpen).toHaveBeenCalledWith(false);
    });

    it('should update existing information when id is provided', async () => {
      const hook = createHook();

      await hook.handleAddInformation({
        id: 'INFO-001',
        updates: { title: 'Updated Title' },
      });

      expect(mockSetInformation).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetSelectedInformation).toHaveBeenCalledWith(null);
    });
  });

  describe('handleEditInformation', () => {
    it('should open modal with information for editing', () => {
      const hook = createHook();

      hook.handleEditInformation(mockInformation[0]);

      expect(mockSetSelectedInformation).toHaveBeenCalledWith(mockInformation[0]);
      expect(mockSetIsInformationModalOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDeleteInformation', () => {
    it('should permanently delete information', () => {
      const hook = createHook();

      hook.handleDeleteInformation('INFO-001');

      expect(mockSetInformation).toHaveBeenCalledWith(expect.any(Function));
      expect(mockDeleteArtifact).toHaveBeenCalledWith('information', 'INFO-001');
    });

    it('should filter out deleted information from state', () => {
      const infoList: Information[] = [
        {
          id: 'INFO-001',
          title: 'To Delete',
          content: '',
          type: 'note',
          revision: '01',
          dateCreated: 1000000,
          lastModified: 1000000,
        },
        {
          id: 'INFO-002',
          title: 'Keep',
          content: '',
          type: 'note',
          revision: '01',
          dateCreated: 1000000,
          lastModified: 1000000,
        },
      ];

      let capturedUpdater: any;
      mockSetInformation.mockImplementation((updater: any) => {
        capturedUpdater = updater;
      });

      mockInformation = infoList;
      const hook = createHook();

      hook.handleDeleteInformation('INFO-001');

      const result = capturedUpdater(infoList);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('INFO-002');
    });
  });
});
