import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RevisionHistoryTab } from '../RevisionHistoryTab';
import { gitService } from '../../services/gitService';

// Mock gitService
vi.mock('../../services/gitService', () => ({
    gitService: {
        getArtifactHistory: vi.fn()
    }
}));

describe('RevisionHistoryTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render loading state initially', () => {
        (gitService.getArtifactHistory as any).mockReturnValue(new Promise(() => { })); // Never resolves
        render(<RevisionHistoryTab artifactId="123" artifactType="requirements" />);
        expect(screen.getByText('Loading history...')).toBeInTheDocument();
    });

    it('should render empty state when no history', async () => {
        (gitService.getArtifactHistory as any).mockResolvedValue([]);
        render(<RevisionHistoryTab artifactId="123" artifactType="requirements" />);

        await waitFor(() => {
            expect(screen.queryByText('Loading history...')).not.toBeInTheDocument();
        });
        expect(screen.getByText('No revision history available.')).toBeInTheDocument();
    });

    it('should render history table', async () => {
        const mockCommits = [
            {
                hash: 'abcdef123456',
                message: 'Initial commit',
                author: 'John Doe',
                timestamp: 1678886400000 // 2023-03-15
            }
        ];
        (gitService.getArtifactHistory as any).mockResolvedValue(mockCommits);

        render(<RevisionHistoryTab artifactId="123" artifactType="requirements" />);

        await waitFor(() => {
            expect(screen.queryByText('Loading history...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Initial commit')).toBeInTheDocument();
        expect(screen.getByText('abcdef1')).toBeInTheDocument(); // Short hash
    });
});
