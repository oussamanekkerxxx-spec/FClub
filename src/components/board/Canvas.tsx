import React, { useRef, useState, useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { Minimize, Plus } from 'lucide-react';

const COLORS = [
  '#1B2A4A', // navy
  '#C4873A', // amber
  '#2D7A4F', // forest
  '#5C3D8F', // plum
];

export default function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { notes, addNote } = useBoardStore();
  
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  
  // Create a new note state
  const [draftNote, setDraftNote] = useState<{x: number, y: number} | null>(null);
  const [draftText, setDraftText] = useState('');

  const handlePointerDown = (e: React.PointerEvent) => {
    // If we click on the draft input, don't drag
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setTransform({
      ...transform,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomSensitivity = 0.002;
    const delta = -e.deltaY * zoomSensitivity;
    
    let newScale = transform.scale * Math.exp(delta);
    // Limit scale
    newScale = Math.max(0.1, Math.min(newScale, 5));

    // Calculate zoom towards mouse position
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleRatio = newScale / transform.scale;
      
      setTransform({
        scale: newScale,
        x: mouseX - (mouseX - transform.x) * scaleRatio,
        y: mouseY - (mouseY - transform.y) * scaleRatio,
      });
    }
  };

  useEffect(() => {
    const currentRef = canvasRef.current;
    if (currentRef) {
      currentRef.addEventListener('wheel', handleWheel, { passive: false });
      return () => currentRef.removeEventListener('wheel', handleWheel);
    }
  }, [transform]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (draftNote) return; // Finish current draft first
    
    // Calculate world coordinates
    const worldX = (e.clientX - transform.x) / transform.scale;
    const worldY = (e.clientY - transform.y) / transform.scale;
    
    setDraftNote({ x: worldX, y: worldY });
    setDraftText('');
  };

  const saveDraft = () => {
    if (draftNote && draftText.trim() !== '') {
      addNote({
        x: draftNote.x,
        y: draftNote.y,
        text: draftText.trim(),
        color: selectedColor,
      });
    }
    setDraftNote(null);
  };

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div className="relative w-full h-full overflow-hidden bg-[var(--color-bg)]" style={{ isolation: 'isolate' }}>
      {/* Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-50 text-[var(--color-border)] dot-pattern" />

      {/* Toolbar */}
      <div className="absolute top-6 left-6 z-50 flex flex-col gap-4">
        <div className="sc-card-warm p-2 flex flex-col gap-2">
          {COLORS.map(c => (
            <button 
              key={c}
              onClick={() => setSelectedColor(c)}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              style={{ 
                backgroundColor: c, 
                borderColor: selectedColor === c ? 'white' : 'transparent',
                boxShadow: selectedColor === c ? '0 0 0 2px var(--color-amber)' : 'none'
              }}
              title="Select color"
            />
          ))}
        </div>
      </div>
      
      <div className="absolute top-6 right-6 z-50 flex gap-2">
        <button className="sc-card p-3 hover:bg-[var(--color-parchment)] transition-colors" onClick={resetView} title="Reset View">
          <Minimize className="w-5 h-5 text-navy-light" />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 text-sm font-medium text-[var(--color-text-secondary)] bg-white/80 px-4 py-2 rounded-full backdrop-blur-sm border border-[var(--color-border)] shadow-sm pointer-events-none select-none">
        Double click anywhere to leave a note • Scroll to zoom • Drag to pan
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full touch-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: 0,
            height: 0,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          className="will-change-transform"
        >
          {notes.map(note => (
            <div
              key={note.id}
              style={{
                position: 'absolute',
                left: note.x,
                top: note.y,
                transform: 'translate(-50%, -50%)',
                color: note.color,
                fontWeight: 600,
                fontSize: '16px',
                whiteSpace: 'nowrap',
                fontFamily: 'Inter, sans-serif'
              }}
              className="select-none text-shadow-sm pointer-events-none"
            >
              {note.text}
            </div>
          ))}

          {draftNote && (
            <div
              style={{
                position: 'absolute',
                left: draftNote.x,
                top: draftNote.y,
                transform: `translate(-50%, -50%) scale(${1 / transform.scale})`, // keep input readable regardless of zoom
              }}
              className="z-50"
            >
              <div className="flex gap-2 items-center bg-white p-2 rounded-xl shadow-floating border border-[var(--color-border)]">
                <input
                  autoFocus
                  type="text"
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveDraft();
                    if (e.key === 'Escape') setDraftNote(null);
                  }}
                  className="bg-transparent border-none outline-none font-medium text-[16px] px-2 min-w-[150px]"
                  style={{ color: selectedColor, fontFamily: 'Inter, sans-serif' }}
                  placeholder="Type a message..."
                />
                <button onClick={saveDraft} className="bg-[var(--color-amber)] text-white p-2 rounded-lg hover:bg-[#D4975A] transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
