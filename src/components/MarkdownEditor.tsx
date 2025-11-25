import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Eye, Edit2 } from 'lucide-react';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    height?: number;
    placeholder?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    label,
    height = 200,
    placeholder = 'Enter text with Markdown formatting...'
}) => {
    const [isEditMode, setIsEditMode] = useState(true);

    return (
        <div className="markdown-editor-container">
            {label && (
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                        {label}
                    </label>
                    <button
                        type="button"
                        onClick={() => setIsEditMode(!isEditMode)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                        title={isEditMode ? 'Switch to Preview' : 'Switch to Edit'}
                    >
                        {isEditMode ? (
                            <>
                                <Eye className="w-3 h-3" />
                                Preview
                            </>
                        ) : (
                            <>
                                <Edit2 className="w-3 h-3" />
                                Edit
                            </>
                        )}
                    </button>
                </div>
            )}

            {isEditMode ? (
                <div data-color-mode="dark">
                    <MDEditor
                        value={value}
                        onChange={(val) => onChange(val || '')}
                        height={height}
                        preview="edit"
                        hideToolbar={false}
                        enableScroll={true}
                        textareaProps={{
                            placeholder: placeholder
                        }}
                    />
                </div>
            ) : (
                <div
                    className="markdown-preview"
                    style={{
                        minHeight: `${height}px`,
                        maxHeight: `${height + 100}px`,
                        overflowY: 'auto',
                        border: '1px solid #374151',
                        borderRadius: '0.375rem',
                        padding: '1rem',
                        backgroundColor: '#1f2937'
                    }}
                >
                    {value ? (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                // Custom styling for rendered elements
                                h1: ({ ...props }) => <h1 className="text-2xl font-bold mb-3 text-gray-100" {...props} />,
                                h2: ({ ...props }) => <h2 className="text-xl font-bold mb-2 text-gray-100" {...props} />,
                                h3: ({ ...props }) => <h3 className="text-lg font-bold mb-2 text-gray-200" {...props} />,
                                h4: ({ ...props }) => <h4 className="text-base font-bold mb-1 text-gray-200" {...props} />,
                                p: ({ ...props }) => <p className="mb-2 text-gray-300" {...props} />,
                                ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 text-gray-300 space-y-1" {...props} />,
                                ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 text-gray-300 space-y-1" {...props} />,
                                li: ({ ...props }) => <li className="text-gray-300" {...props} />,
                                blockquote: ({ ...props }) => (
                                    <blockquote className="border-l-4 border-indigo-500 pl-4 italic my-2 text-gray-400" {...props} />
                                ),
                                code: ({ className, children, ...props }) => {
                                    const inline = !className;
                                    return inline ? (
                                        <code className="bg-gray-700 px-1 py-0.5 rounded text-sm text-indigo-300" {...props}>
                                            {children}
                                        </code>
                                    ) : (
                                        <code className={`${className} block bg-gray-800 p-3 rounded text-sm overflow-x-auto`} {...props}>
                                            {children}
                                        </code>
                                    );
                                },
                                pre: ({ ...props }) => <pre className="bg-gray-800 p-3 rounded mb-2 overflow-x-auto" {...props} />,
                                table: ({ ...props }) => (
                                    <div className="overflow-x-auto mb-2">
                                        <table className="min-w-full border border-gray-600" {...props} />
                                    </div>
                                ),
                                thead: ({ ...props }) => <thead className="bg-gray-700" {...props} />,
                                th: ({ ...props }) => <th className="border border-gray-600 px-3 py-2 text-left text-gray-200" {...props} />,
                                td: ({ ...props }) => <td className="border border-gray-600 px-3 py-2 text-gray-300" {...props} />,
                                a: ({ ...props }) => <a className="text-indigo-400 hover:text-indigo-300 underline" {...props} />,
                                strong: ({ ...props }) => <strong className="font-bold text-gray-100" {...props} />,
                                em: ({ ...props }) => <em className="italic text-gray-300" {...props} />,
                                hr: ({ ...props }) => <hr className="my-3 border-gray-600" {...props} />
                            }}
                        >
                            {value}
                        </ReactMarkdown>
                    ) : (
                        <p className="text-gray-500 italic">No content</p>
                    )}
                </div>
            )}
        </div>
    );
};
