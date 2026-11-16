/**
 * HeaderBar Component
 *
 * Header bar containing breadcrumb navigation, search bar, action buttons,
 * and Create/Import/Export dropdown menus.
 * Uses useHeaderBar hook for menu state management.
 */

import React from 'react';
import {
  Plus,
  Download,
  Upload,
  Clock,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Search,
  FolderOpen,
  User,
  HelpCircle,
  SlidersHorizontal,
} from 'lucide-react';
import type { ProjectBaseline } from '../../types';
import {
  headerButtonStyle,
  dropdownMenuStyle,
  searchContainerStyle,
  searchIconStyle,
  searchInputStyle,
  dropdownItemStyle,
  hoverHandlers,
  primaryButtonStyle,
  advancedSearchButtonStyle,
} from './layoutStyles';
import { DropdownMenuItem } from './DropdownMenuItem';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useHeaderBar } from '../../hooks/useHeaderBar';
import { ThemeToggle } from './ThemeToggle';

interface HeaderBarProps {
  onSearch?: (query: string) => void;
  onViewHistory?: () => void;
  onNewRequirement: () => void;
  onNewUseCase?: () => void;
  onNewTestCase?: () => void;
  onNewInformation?: () => void;
  onNewRisk?: () => void;
  onNewWorkflow?: () => void;
  onNewLink?: () => void;
  onNewCustomAttribute?: () => void;
  onNewDocument?: () => void;
  onImport?: () => void;
  onImportExcel?: () => void;
  onOpenExportModal?: () => void;
  onExport?: () => void;
  onExportPDF?: (selectedBaseline: ProjectBaseline | null) => void;
  onExportExcel?: () => void;
  baselines?: ProjectBaseline[];
  onOpenUserSettings?: () => void;
  currentUserName?: string;
  onOpenAdvancedSearch?: () => void;
  onHelp?: () => void;
  onChangeFolder?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onSearch,
  onViewHistory,
  onNewRequirement,
  onNewUseCase,
  onNewTestCase,
  onNewInformation,
  onNewRisk,
  onNewWorkflow,
  onNewLink,
  onNewCustomAttribute,
  onImport,
  onImportExcel,
  onOpenExportModal,
  onExport,
  onExportPDF,
  onExportExcel,
  baselines = [],
  onOpenUserSettings,
  currentUserName,
  onOpenAdvancedSearch,
  onHelp,
  onNewDocument,
  onChangeFolder,
}) => {
  const {
    isExportMenuOpen,
    setIsExportMenuOpen,
    isImportMenuOpen,
    setIsImportMenuOpen,
    isCreateMenuOpen,
    setIsCreateMenuOpen,
    selectedBaselineId,
    setSelectedBaselineId,
    exportMenuRef,
    importMenuRef,
    createMenuRef,
    searchInputRef,
    closeAllMenus,
    focusSearch,
    blurSearch,
  } = useHeaderBar();

  useKeyboardShortcuts({
    onSearch: focusSearch,
    onClose: () => {
      blurSearch();
      closeAllMenus();
    },
    onHelp,
  });

  const handleExportPDF = () => {
    const selected =
      selectedBaselineId === 'current'
        ? null
        : baselines.find((b) => b.id === selectedBaselineId) || null;
    onExportPDF?.(selected);
    setIsExportMenuOpen(false);
  };

  const handleExportJSON = () => {
    onExport?.();
    setIsExportMenuOpen(false);
  };

  return (
    <header
      style={{
        height: '52px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 16px',
        backgroundColor: 'var(--color-bg-app)',
      }}
    >
      {/* Unified Search Bar */}
      {onSearch && (
        <div style={searchContainerStyle} className="tf-search">
          <Search size={16} style={searchIconStyle} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search... (Ctrl+K)"
            onChange={(e) => onSearch(e.target.value)}
            style={searchInputStyle}
          />
          {onOpenAdvancedSearch && (
            <button
              onClick={onOpenAdvancedSearch}
              style={advancedSearchButtonStyle}
              title="Advanced Search (Ctrl+Shift+F)"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-accent)';
                e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-muted)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <SlidersHorizontal size={16} />
            </button>
          )}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {/* Create New Dropdown */}
        <div style={{ position: 'relative' }} ref={createMenuRef}>
          <button
            onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
            style={primaryButtonStyle}
            className="tf-btn-primary"
          >
            <Plus size={18} />
            Create New
            <ChevronDown size={14} />
          </button>

          {isCreateMenuOpen && (
            <div style={{ ...dropdownMenuStyle, minWidth: '200px' }}>
              <DropdownMenuItem
                onClick={() => {
                  onNewRequirement();
                  setIsCreateMenuOpen(false);
                }}
                icon={Plus}
                label="New Requirement"
              />
              {onNewUseCase && (
                <DropdownMenuItem
                  onClick={() => {
                    onNewUseCase();
                    setIsCreateMenuOpen(false);
                  }}
                  icon={Plus}
                  label="New Use Case"
                  showBorder
                />
              )}
              {onNewTestCase && (
                <DropdownMenuItem
                  onClick={() => {
                    onNewTestCase();
                    setIsCreateMenuOpen(false);
                  }}
                  icon={Plus}
                  label="New Test Case"
                  showBorder
                />
              )}
              {onNewInformation && (
                <DropdownMenuItem
                  onClick={() => {
                    onNewInformation();
                    setIsCreateMenuOpen(false);
                  }}
                  icon={Plus}
                  label="New Information"
                />
              )}
              {onNewDocument && (
                <DropdownMenuItem
                  onClick={() => {
                    onNewDocument();
                    setIsCreateMenuOpen(false);
                  }}
                  icon={Plus}
                  label="New Document"
                />
              )}
              {onNewRisk && (
                <DropdownMenuItem
                  onClick={() => {
                    onNewRisk();
                    setIsCreateMenuOpen(false);
                  }}
                  icon={Plus}
                  label="New Risk"
                  showBorder
                />
              )}
              {onNewWorkflow && (
                <DropdownMenuItem
                  onClick={() => {
                    onNewWorkflow();
                    setIsCreateMenuOpen(false);
                  }}
                  icon={Plus}
                  label="New Workflow"
                  showBorder
                />
              )}
              {onNewLink && (
                <DropdownMenuItem
                  onClick={() => {
                    onNewLink();
                    setIsCreateMenuOpen(false);
                  }}
                  icon={Plus}
                  label="New Link"
                  showBorder
                />
              )}
              {onNewCustomAttribute && (
                <DropdownMenuItem
                  onClick={() => {
                    onNewCustomAttribute();
                    setIsCreateMenuOpen(false);
                  }}
                  icon={Plus}
                  label="New Custom Attribute"
                  showBorder
                />
              )}
            </div>
          )}
        </div>

        {/* Change Folder Button */}
        {onChangeFolder && (
          <button
            onClick={() => {
              const confirmed = window.confirm(
                'Are you sure you want to change the working folder?\n\n' +
                  'This will close the current project and prompt you to select a new folder.\n\n' +
                  'Make sure to commit any pending changes before switching.'
              );
              if (confirmed) {
                onChangeFolder();
              }
            }}
            style={headerButtonStyle}
            className="tf-btn"
            title="Change Working Folder"
          >
            <FolderOpen size={18} />
            Change Folder
          </button>
        )}

        {/* History Button */}
        {onViewHistory && (
          <button onClick={onViewHistory} style={headerButtonStyle} className="tf-btn">
            <Clock size={18} />
            History
          </button>
        )}

        {/* User Settings Button */}
        {onOpenUserSettings && (
          <button
            onClick={onOpenUserSettings}
            style={headerButtonStyle}
            className="tf-btn"
            title="User Settings"
          >
            <User size={18} />
            {currentUserName || 'User'}
          </button>
        )}

        {/* Help Button */}
        {onHelp && (
          <button onClick={onHelp} style={headerButtonStyle} className="tf-btn" title="Help (F1)">
            <HelpCircle size={18} />
            Help
          </button>
        )}

        {/* Import Dropdown */}
        <div style={{ position: 'relative' }} ref={importMenuRef}>
          <button
            onClick={() => setIsImportMenuOpen(!isImportMenuOpen)}
            style={headerButtonStyle}
            className="tf-btn"
            data-testid="import-button"
          >
            <Upload size={18} />
            Import
            <ChevronDown size={14} />
          </button>

          {isImportMenuOpen && (
            <div style={dropdownMenuStyle}>
              {onImport && (
                <DropdownMenuItem
                  onClick={() => {
                    onImport();
                    setIsImportMenuOpen(false);
                  }}
                  icon={Upload}
                  label="Import JSON"
                />
              )}
              {onImportExcel && (
                <DropdownMenuItem
                  onClick={() => {
                    onImportExcel();
                    setIsImportMenuOpen(false);
                  }}
                  icon={FileSpreadsheet}
                  label="Import Excel"
                  showBorder={!!onImport}
                />
              )}
            </div>
          )}
        </div>

        {/* Export Button */}
        {onOpenExportModal && (
          <button
            onClick={onOpenExportModal}
            style={headerButtonStyle}
            className="tf-btn"
            data-testid="export-button"
          >
            <Download size={18} />
            Export
          </button>
        )}

        {/* Legacy Export Dropdown (kept for E2E tests and backward compatibility) */}
        {!onOpenExportModal && (
          <div style={{ position: 'relative' }} ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              style={headerButtonStyle}
              className="tf-btn"
              data-testid="export-button-legacy"
            >
              <Download size={18} />
              Export
              <ChevronDown size={14} />
            </button>

            {isExportMenuOpen && (
              <div data-testid="export-dropdown" style={dropdownMenuStyle}>
                {/* PDF Export with baseline selection */}
                {onExportPDF && (
                  <div style={{ padding: '0.5rem 1rem' }}>
                    <label
                      htmlFor="baseline-select"
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 500,
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      Export Version:
                    </label>
                    <select
                      id="baseline-select"
                      value={selectedBaselineId}
                      onChange={(e) => setSelectedBaselineId(e.target.value)}
                      style={{
                        width: '100%',
                        marginBottom: 8,
                        padding: '0.25rem',
                        borderRadius: 4,
                      }}
                    >
                      <option value="current">Current State</option>
                      {baselines.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.version})
                        </option>
                      ))}
                    </select>
                    <button onClick={handleExportPDF} style={dropdownItemStyle} {...hoverHandlers}>
                      <FileText size={16} />
                      Export to PDF
                    </button>
                  </div>
                )}

                {/* Excel Export */}
                {onExportExcel && (
                  <DropdownMenuItem
                    onClick={() => {
                      onExportExcel();
                      setIsExportMenuOpen(false);
                    }}
                    icon={FileSpreadsheet}
                    label="Export to Excel"
                  />
                )}

                {/* JSON Export */}
                {onExport && (
                  <DropdownMenuItem
                    onClick={handleExportJSON}
                    icon={Download}
                    label="Export JSON"
                    showBorder
                    testId="export-json"
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
};
