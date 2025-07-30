import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// UTILITIES & CONSTANTS

// Color Palette based on request
const COLORS = {
  primary: "#1976d2",
  accent: "#ffca28",
  secondary: "#424242",
  background: "#ffffff",
  border: "#f0f0f0",
  error: "#c62828",
};

// Demo: generate a unique id for notes.
// In future, replace with backend IDs.
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 8);

// PUBLIC_INTERFACE
function App() {
  // NOTES STATE
  const [notes, setNotes] = useState(() => {
    // Load saved notes from localStorage, fallback to empty
    const saved = window.localStorage.getItem("notes");
    return saved ? JSON.parse(saved) : [];
  });
  // SEARCH STATE
  const [search, setSearch] = useState("");
  // SELECTED/EDITING NOTE
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  // "true" if the editor is open for new note
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  // THEME (user can only switch if the feature is later needed)
  const [theme] = useState("light");

  // INPUT FOCUS MANAGEMENT for a11y
  const editorInputRef = useRef();

  // Persist notes to localStorage whenever changed
  useEffect(() => {
    window.localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // Focus the editor for better UX when opening
  useEffect(() => {
    if ((selectedNoteId || isCreatingNew) && editorInputRef.current) {
      editorInputRef.current.focus();
    }
  }, [selectedNoteId, isCreatingNew]);

  // Filtered notes by search query (case-insensitive)
  const filteredNotes = notes.filter(note =>
    (note.title + " " + note.content).toLowerCase().includes(search.toLowerCase())
  );

  // Selected note object for editing/viewing
  const selectedNote = notes.find(note => note.id === selectedNoteId);

  // --- NOTE CRUD Logic ---

  // PUBLIC_INTERFACE
  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  // PUBLIC_INTERFACE
  function handleCreateNoteClick() {
    setSelectedNoteId(null);
    setIsCreatingNew(true);
  }

  // PUBLIC_INTERFACE
  function handleSelectNote(noteId) {
    setSelectedNoteId(noteId);
    setIsCreatingNew(false);
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(noteId) {
    // Confirm for safety
    if (window.confirm("Delete this note? This action cannot be undone.")) {
      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNoteId === noteId) setSelectedNoteId(null);
      setIsCreatingNew(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleSaveNote(edited) {
    // If creating new note
    if (isCreatingNew) {
      const newId = generateId();
      setNotes([
        { id: newId, ...edited, created: new Date().toISOString() },
        ...notes,
      ]);
      setSelectedNoteId(newId);
      setIsCreatingNew(false);
    } else if (selectedNote) {
      // Updating existing note
      setNotes(
        notes.map(n =>
          n.id === selectedNoteId
            ? { ...n, ...edited, updated: new Date().toISOString() }
            : n
        )
      );
    }
  }

  // PUBLIC_INTERFACE
  function handleCancelEdit() {
    setSelectedNoteId(null);
    setIsCreatingNew(false);
  }

  // RENDER

  return (
    <div
      className="notes-app"
      style={{
        "--primary": COLORS.primary,
        "--secondary": COLORS.secondary,
        "--accent": COLORS.accent,
        "--bg": COLORS.background,
        "--border": COLORS.border,
        background: "var(--bg)",
        color: "var(--secondary)"
      }}
      data-theme={theme}
    >
      {/* HEADER */}
      <header className="notes-header" style={headerStyle}>
        <span className="notes-logo" aria-label="logo" style={logoStyle}>🗒️</span>
        <h1 className="notes-title" style={{ margin: 0, color: COLORS.primary, fontWeight: 700, fontSize: 24 }}>
          Minimal Notes
        </h1>
        <div style={{ flex: 1 }} />
        <input
          type="text"
          placeholder="Search notes…"
          className="notes-search"
          value={search}
          onChange={handleSearchChange}
          aria-label="Search notes"
          style={searchInputStyle}
        />
      </header>
      {/* MAIN SECTION: LIST + EDITOR */}
      <main className="notes-main" style={mainStyle}>
        {/* NOTES LIST */}
        <section className="notes-list-pane" style={listPaneStyle}>
          <ul className="notes-list" style={notesListStyle}>
            {filteredNotes.length === 0 && (
              <li style={{ padding: "2em", color: "#ccc", textAlign: "center" }}>
                {notes.length === 0
                  ? "No notes yet. Click + to create your first note!"
                  : "No notes found for your search…"}
              </li>
            )}
            {filteredNotes.map(note => (
              <li
                key={note.id}
                className="note-list-item"
                style={{
                  ...noteListItemStyle,
                  background: note.id === selectedNoteId ? "#e3f0fb" : "#fff",
                  borderColor: note.id === selectedNoteId ? COLORS.primary : "var(--border)",
                }}
                onClick={() => handleSelectNote(note.id)}
                tabIndex={0}
                aria-selected={note.id === selectedNoteId}
                onKeyDown={e =>
                  (e.key === 'Enter' || e.key === ' ') && handleSelectNote(note.id)
                }
              >
                <div style={{ fontWeight: 600, color: COLORS.primary, fontSize: "1.09em" }}>
                  {note.title || <span style={{ color: "#bbb", fontStyle: "italic" }}>Untitled</span>}
                </div>
                {note.content && (
                  <div style={noteListContentStyle}>
                    {note.content.substring(0, 48)}
                    {note.content.length > 48 ? "…" : ""}
                  </div>
                )}
                <div style={noteMetaStyle}>
                  <span style={{ fontSize: 11, color: "#aaa" }}>
                    {note.updated
                      ? "Edited: " + formatShortDate(note.updated)
                      : "Created: " + formatShortDate(note.created)}
                  </span>
                  <button
                    className="delete-btn"
                    style={deleteBtnStyle}
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    aria-label="Delete note"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
        {/* EDITOR PANE */}
        <section className="notes-editor-pane" style={editorPaneStyle}>
          {(selectedNote || isCreatingNew) ? (
            <NoteEditor
              key={selectedNote && !isCreatingNew ? selectedNote.id : "new"}
              note={isCreatingNew ? { title: "", content: "" } : selectedNote}
              onSave={handleSaveNote}
              onCancel={handleCancelEdit}
              inputRef={editorInputRef}
              isNew={isCreatingNew}
            />
          ) : (
            <div style={editorEmptyStyle}>
              <span style={{ color: "#bbb", fontSize: 32, marginBottom: 20 }}>📝</span>
              <div style={{ color: "#aaa", fontSize: 16 }}>Select a note or create a new note…</div>
            </div>
          )}
        </section>
        {/* ADD NOTE FLOATING BUTTON */}
        <button
          className="notes-add-fab"
          style={fabStyle}
          aria-label="Add Note"
          title="Add New Note"
          onClick={handleCreateNoteClick}
        >
          +
        </button>
      </main>
      {/* Future: Show error/info dialogs here */}
    </div>
  );
}

// --- SUBCOMPONENT: NoteEditor ---
// PUBLIC_INTERFACE
function NoteEditor({ note, onSave, onCancel, inputRef, isNew }) {
  // Use state for controlled inputs
  const [title, setTitle] = useState(note ? note.title : '');
  const [content, setContent] = useState(note ? note.content : '');

  // For minimal a11y, allow Save by Ctrl+Enter
  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
    // Cancel by Escape
    if (e.key === 'Escape') {
      onCancel();
    }
  }
  function handleSave() {
    // never allow blank, remove surrounding whitespace
    if (title.trim() === "" && content.trim() === "") {
      alert("Cannot save empty note!");
      return;
    }
    onSave({ title: title.trim(), content: content.trim() });
  }
  return (
    <form
      className="note-editor-form"
      style={noteEditorFormStyle}
      onSubmit={e => {
        e.preventDefault();
        handleSave();
      }}
      aria-label={isNew ? "New Note" : "Edit Note"}
    >
      <input
        name="title"
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={noteTitleInputStyle}
        ref={inputRef}
        onKeyDown={handleKeyDown}
        maxLength={80}
        autoFocus
        aria-label="Note Title"
      />
      <textarea
        name="content"
        placeholder="Write your note here…"
        value={content}
        onChange={e => setContent(e.target.value)}
        style={noteContentInputStyle}
        rows={8}
        onKeyDown={handleKeyDown}
        aria-label="Note Content"
        maxLength={5000}
      />
      <div style={noteEditorButtonsStyle}>
        <button
          type="submit"
          style={saveBtnStyle}
          aria-label="Save Note"
        >
          {isNew ? "Save Note" : "Update"}
        </button>
        <button
          type="button"
          style={cancelBtnStyle}
          onClick={onCancel}
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// --- HELPERS ---
function formatShortDate(dateStr) {
  // e.g., 2024-05-22T13:15:00.000Z -> 'May 22, 13:15'
  const d = new Date(dateStr);
  // Display with no seconds, local time
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    ", " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

// --- INLINE/JS STYLES FOR MINIMALISM and THEME ---
const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "1em",
  padding: "1.5em 2em 1em 2em",
  borderBottom: "1px solid var(--border)",
  background: "#fafbfc",
  position: "sticky",
  top: 0,
  zIndex: 2,
};

const logoStyle = {
  fontSize: 28,
  color: "var(--accent)",
  marginRight: 8,
};

const searchInputStyle = {
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "0.45em 1em",
  fontSize: 15,
  color: "#333",
  width: 200,
  outline: "none",
  background: "#fff",
  transition: "border 0.18s",
};

const mainStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "stretch",
  minHeight: "80vh",
  background: "#f3f7fa",
  position: "relative",
};

const listPaneStyle = {
  flex: "0 0 320px",
  borderRight: "1px solid var(--border)",
  background: "#fff",
  minHeight: "inherit",
  maxWidth: "35vw",
  overflowY: "auto",
  height: "calc(100vh - 65px)",
};

const notesListStyle = {
  listStyle: "none",
  margin: 0,
  padding: 0,
};

const noteListItemStyle = {
  padding: "1.1em 1.2em 0.8em 1.3em",
  borderBottom: "1px solid var(--border)",
  borderLeft: "4px solid transparent",
  borderRadius: "0px 7px 7px 0",
  margin: 0,
  background: "#fff",
  cursor: "pointer",
  userSelect: "none",
  outline: "none",
  transition: "background 0.16s, border-color 0.16s",
};

const noteListContentStyle = {
  fontSize: "0.97em",
  color: "#424242b7",
  margin: "2px 0 3px 0",
  wordBreak: "break-word",
  lineHeight: "1.4",
};

const noteMetaStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 5,
};

const deleteBtnStyle = {
  background: "none",
  border: "none",
  color: COLORS.error,
  cursor: "pointer",
  fontSize: "1.1em",
  padding: 0,
  marginLeft: 8,
  borderRadius: 5,
  outline: "none",
  transition: "background 0.16s",
};

const editorPaneStyle = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  alignItems: "stretch",
  justifyContent: "center",
  background: "#f8fafb",
  maxWidth: "900px",
  width: "100%",
  position: "relative",
};

const editorEmptyStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  height: "100%",
  justifyContent: "center",
  color: "#aaa",
  fontSize: "1.2em",
};

const noteEditorFormStyle = {
  padding: "3em 2.3em 2em 2.3em",
  margin: "3em auto",
  maxWidth: 500,
  width: "100%",
  background: "#fff",
  borderRadius: "8px",
  boxShadow: "0 2px 7px 0 #80807311",
  display: "flex",
  flexDirection: "column",
  gap: "1em",
  border: "1px solid var(--border)",
};

const noteTitleInputStyle = {
  fontSize: 19,
  fontWeight: 600,
  padding: "0.85em 1em",
  border: "1px solid var(--border)",
  borderRadius: 4,
  outline: "none",
  background: "#f6fafd",
  color: "#222",
  transition: "border 0.15s",
};

const noteContentInputStyle = {
  fontSize: 15,
  padding: "1em 1em",
  border: "1px solid var(--border)",
  borderRadius: 6,
  outline: "none",
  background: "#f9fafb",
  color: "#222",
  resize: "vertical",
  minHeight: 150,
  transition: "border 0.15s",
};

const noteEditorButtonsStyle = {
  display: "flex",
  gap: "1em",
  alignItems: "center",
  marginTop: 8,
  flexWrap: "wrap",
};

const saveBtnStyle = {
  background: COLORS.primary,
  color: "#fff",
  border: "none",
  padding: "0.6em 1.6em",
  borderRadius: 5,
  fontWeight: 600,
  fontSize: 15,
  cursor: "pointer",
  transition: "background 0.17s",
  outline: "none",
};
const cancelBtnStyle = {
  background: "#eee",
  color: "#333",
  border: "none",
  padding: "0.6em 1.2em",
  borderRadius: 5,
  fontWeight: 500,
  fontSize: 15,
  cursor: "pointer",
  transition: "background 0.15s",
  outline: "none",
};

const fabStyle = {
  position: "fixed",
  bottom: 34,
  right: 38,
  background: COLORS.accent,
  color: "#222",
  fontSize: "2.1em",
  width: 56,
  height: 56,
  borderRadius: "100%",
  border: "none",
  boxShadow: "0 4px 16px 0 #8080731b",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
  cursor: "pointer",
  transition: "box-shadow 0.19s, background 0.18s",
};
export default App;
