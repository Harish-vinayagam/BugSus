import MonacoEditor, { OnChange, OnMount } from '@monaco-editor/react';

// ── Props ─────────────────────────────────────────────────────────────────────

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  height?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Thin, reusable wrapper around Monaco Editor.
 *
 * Rules:
 *  - No business logic. Zero knowledge of tasks or game state.
 *  - All state lives in the parent; this component is fully controlled.
 *  - `onChange` is always called with a string (never undefined).
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'typescript',
  height = '100%',
}) => {
  const handleMount: OnMount = (editor, monaco) => {
    // Remove the default keybinding for F1 (command palette) inside the
    // editor so it doesn't interfere with the game's keyboard shortcuts.
    editor.addCommand(monaco.KeyCode.F1, () => undefined);
  };

  const handleChange: OnChange = (val) => {
    onChange(val ?? '');
  };

  return (
    <MonacoEditor
      height={height}
      language={language}
      value={value}
      theme="vs-dark"
      onChange={handleChange}
      onMount={handleMount}
      options={{
        fontSize: 13,
        fontFamily: "'Share Tech Mono', 'Courier New', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        tabSize: 2,
        wordWrap: 'on',
        automaticLayout: true,
        padding: { top: 8, bottom: 8 },
      }}
    />
  );
};

export default CodeEditor;
