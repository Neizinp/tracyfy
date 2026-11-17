import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useFileSystem } from '../app/providers';

/**
 * Project files that could not be read. They are left out of the app until
 * fixed (by hand, or by reverting them in git), never loaded as wrong data.
 */
export const FileProblemsNotice: React.FC = () => {
  const { fileProblems } = useFileSystem();
  if (fileProblems.length === 0) return null;

  return (
    <div role="alert" className="tf-problems">
      <div className="tf-problems-title">
        <AlertTriangle size={16} />
        {fileProblems.length === 1
          ? '1 file could not be read and is not shown:'
          : `${fileProblems.length} files could not be read and are not shown:`}
      </div>
      <ul>
        {fileProblems.map((p) => (
          <li key={p.path}>
            <span className="tf-mono">{p.path}</span>: {p.message}
          </li>
        ))}
      </ul>
    </div>
  );
};
