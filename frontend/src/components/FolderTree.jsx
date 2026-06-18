import { useState } from "react";

export default function FolderTree({ folders, selectedPath, onSelect, onCreateFolder, currentPath }) {
  const [expanded, setExpanded] = useState(new Set(["/"]));

  const toggle = (path) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const childFolders = folders.filter((f) => f.parent === currentPath);

  return (
    <div className="space-y-1">
      {childFolders.map((folder) => {
        const hasChildren = folders.some((f) => f.parent === folder.path);
        const isSelected = selectedPath === folder.path;
        const isExpanded = expanded.has(folder.path);

        return (
          <div key={folder.path}>
            <div className="flex items-center gap-1">
              {hasChildren && (
                <button
                  onClick={() => toggle(folder.path)}
                  className="p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer text-slate-400 hover:text-white"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-5" />}
              <button
                onClick={() => onSelect(folder.path)}
                className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-950/40 text-emerald-400 font-medium border border-emerald-900/30"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <FolderIcon className="w-4 h-4" />
                <span className="truncate">{folder.name}</span>
              </button>
            </div>
            {isExpanded && hasChildren && (
              <div className="ml-4 border-l border-slate-800 pl-2">
                <FolderTree
                  folders={folders}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  onCreateFolder={onCreateFolder}
                  currentPath={folder.path}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

function ChevronRightIcon(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function FolderIcon(props) {
  return (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-6l-2-2z" />
    </svg>
  );
}
