import { useState } from 'react';
import { X, Printer, Calculator } from 'lucide-react';

// Constants
const GRID_ROWS = 10;
const GRID_COLS = 8;
const CELL_SIZE = 100;

// Simple names list
const SIMPLE_NAMES = [
  'cat', 'dog', 'tree', 'bird',
  'fish', 'star', 'moon', 'sun',
  'leaf', 'cloud', 'rain', 'wind'
];

// Add interfaces/types
interface LibraryItem {
  id: string;
  width: number;
  height: number;
  title: string;
  type: 'score' | 'calculator';
  score?: number;
  name?: string;
  formula?: string;
}

interface Widget {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'score' | 'calculator';
  title: string;
  name: string;
  score: number;
  formula: string;
}

interface DraggingWidget extends Widget {
  isNew: boolean;
  offsetX: number;
  offsetY: number;
}

// Type the utility functions
const generateRandomScore = (): number => Math.floor(Math.random() * 101);

const generateRandomName = (widgets: Widget[]): string => {
  const usedNames = new Set(widgets.map(w => w.name));
  const availableNames = SIMPLE_NAMES.filter(name => !usedNames.has(name));
  return availableNames[Math.floor(Math.random() * availableNames.length)] || 'x';
};

// Improve formula evaluation
const evaluateFormula = (formula: string, variables: Record<string, number>): string => {
  try {
    // Validate formula contains only allowed characters
    if (!/^[a-z0-9\s+\-*/().]+$/i.test(formula)) {
      return 'Error';
    }
    
    const params = Object.keys(variables);
    const args = Object.values(variables);
    const func = new Function(...params, `return ${formula}`);
    const result = func(...args);
    return isNaN(result) ? 'Error' : Number(result).toFixed(2);
  } catch (error) {
    return 'Error';
  }
};

const GridLayoutPage: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [draggingWidget, setDraggingWidget] = useState<DraggingWidget | null>(null);
  
  const libraryItems: LibraryItem[] = [
    { 
      id: 'score', 
      width: 2, 
      height: 1, 
      title: 'Score', 
      type: 'score',
      score: generateRandomScore(),
      name: ''
    },
    { 
      id: 'calc', 
      width: 4,
      height: 2,
      title: 'Calculator', 
      type: 'calculator',
      formula: ''
    }
  ];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, widget: Widget | LibraryItem, isNew = false): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingWidget({
      ...widget,
      isNew,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    } as DraggingWidget);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (!draggingWidget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    let x = Math.floor((e.clientX - rect.left - draggingWidget.offsetX) / CELL_SIZE);
    let y = Math.floor((e.clientY - rect.top - draggingWidget.offsetY) / CELL_SIZE);

    x = Math.max(0, Math.min(x, GRID_COLS - draggingWidget.width));
    y = Math.max(0, Math.min(y, GRID_ROWS - draggingWidget.height));

    // Check for overlaps with other widgets
    const wouldOverlap = widgets.some(existing => 
      existing.id !== draggingWidget.id && (
        x < existing.x + existing.width &&
        x + draggingWidget.width > existing.x &&
        y < existing.y + existing.height &&
        y + draggingWidget.height > existing.y
      )
    );

    if (!wouldOverlap && !draggingWidget.isNew) {
      setWidgets(widgets.map(w => 
        w.id === draggingWidget.id ? { ...w, x, y } : w
      ));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    if (!draggingWidget) return;

    const rect = e.currentTarget.getBoundingClientRect();
    let x = Math.floor((e.clientX - rect.left - draggingWidget.offsetX) / CELL_SIZE);
    let y = Math.floor((e.clientY - rect.top - draggingWidget.offsetY) / CELL_SIZE);

    x = Math.max(0, Math.min(x, GRID_COLS - draggingWidget.width));
    y = Math.max(0, Math.min(y, GRID_ROWS - draggingWidget.height));

    if (draggingWidget.isNew) {
      const newWidget = {
        ...draggingWidget,
        id: `widget-${Date.now()}`,
        x,
        y,
        name: draggingWidget.type === 'score' ? generateRandomName(widgets) : '',
        score: draggingWidget.type === 'score' ? generateRandomScore() : 0
      };

      const wouldOverlap = widgets.some(existing => (
        x < existing.x + existing.width &&
        x + newWidget.width > existing.x &&
        y < existing.y + existing.height &&
        y + newWidget.height > existing.y
      ));

      if (!wouldOverlap) {
        setWidgets([...widgets, newWidget]);
      }
    }
    setDraggingWidget(null);
  };

  const handleResize = (e: React.MouseEvent<HTMLDivElement>, widget: Widget): void => {
    e.preventDefault();
    e.stopPropagation();
    if (widget.type === 'calculator') return;

    const startWidth = widget.width;
    const startHeight = widget.height;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (e: MouseEvent): void => {
      const deltaX = Math.floor((e.clientX - startX) / CELL_SIZE);
      const deltaY = Math.floor((e.clientY - startY) / CELL_SIZE);
      
      const newWidth = Math.max(2, Math.min(
        startWidth + deltaX,
        GRID_COLS - widget.x
      ));
      const newHeight = Math.max(1, Math.min(
        startHeight + deltaY,
        GRID_ROWS - widget.y
      ));
      
      setWidgets(prev => prev.map(w =>
        w.id === widget.id ? { ...w, width: newWidth, height: newHeight } : w
      ));
    };

    const handleMouseUp = (): void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const insertIntoFormula = (widgetId: string, variable: string): void => {
    const textarea = document.querySelector(`#formula-${widgetId}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const formula = textarea.value;
    const newFormula = formula.slice(0, cursorPos) + variable + formula.slice(cursorPos);
    
    setWidgets(widgets.map(w =>
      w.id === widgetId ? { ...w, formula: newFormula } : w
    ));

    setTimeout(() => {
      textarea.focus();
      const newPos = cursorPos + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleDelete = (widgetId: string): void => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
  };

  return (
    <div className="p-4 mb-8">
      <div className="mb-4 flex justify-between items-start">
        <div className="p-4 border rounded bg-gray-50">
          <h2 className="text-lg font-bold mb-2">Widget Library</h2>
          <div className="flex gap-4">
            {libraryItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item, true)}
                className="p-2 bg-white border rounded cursor-move hover:bg-gray-100"
              >
                {item.title}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      <div className="flex justify-center">
        <div
          className="border bg-white relative"
          style={{
            width: CELL_SIZE * GRID_COLS,
            height: CELL_SIZE * GRID_ROWS
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div 
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`
            }}
          >
            {Array(GRID_ROWS * GRID_COLS).fill(0).map((_, i) => (
              <div key={i} className="border border-gray-200" />
            ))}
          </div>

          {widgets.map(widget => (
            <div
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(e, widget)}
              className="absolute bg-blue-100 border border-blue-300 rounded p-2"
              style={{
                left: widget.x * CELL_SIZE,
                top: widget.y * CELL_SIZE,
                width: widget.width * CELL_SIZE - 2,
                height: widget.height * CELL_SIZE - 2
              }}
            >
              <button
                onClick={() => handleDelete(widget.id)}
                className="absolute top-1 right-1 p-1 hover:bg-red-100 rounded"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
              
              {widget.type === 'calculator' ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="w-4 h-4" />
                    <span className="font-bold">Calculator</span>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <textarea
                      id={`formula-${widget.id}`}
                      value={widget.formula || ''}
                      onChange={(e) => setWidgets(widgets.map(w =>
                        w.id === widget.id ? { ...w, formula: e.target.value } : w
                      ))}
                      className="flex-1 p-2 border rounded resize-none mb-2"
                      placeholder="Enter formula (e.g., a + b, Math.round(a / b))"
                    />
                    <div className="flex flex-wrap gap-1 mb-2">
                      {widgets
                        .filter(w => w.type === 'score' && w.name)
                        .map(w => (
                          <button
                            key={w.name}
                            onClick={() => insertIntoFormula(widget.id, w.name)}
                            className="px-2 py-1 text-sm bg-blue-50 hover:bg-blue-100 rounded"
                          >
                            {w.name}
                          </button>
                        ))}
                    </div>
                    <div className="text-lg">
                      Result: {evaluateFormula(widget.formula || '0', 
                        Object.fromEntries(
                          widgets
                            .filter(w => w.type === 'score' && w.name)
                            .map(w => [w.name, Number(w.score) || 0])
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                    <input
                      type="text"
                      value={widget.name || ''}
                      onChange={(e) => {
                        const name = e.target.value.toLowerCase().replace(/[^a-z]/g, '');
                        if (widgets.every(w => w.id === widget.id || w.name !== name)) {
                          setWidgets(widgets.map(w =>
                            w.id === widget.id ? { ...w, name } : w
                          ));
                        }
                      }}
                      className="p-1 border rounded w-20"
                      placeholder="Name"
                      maxLength={10}
                    />
                  <div className="flex items-center mb-2">
                    <input
                      type="number"
                      value={widget.score || 0}
                      onChange={(e) => setWidgets(widgets.map(w =>
                        w.id === widget.id ? { ...w, score: Math.max(0, Math.min(100, parseInt(e.target.value, 10))) } : w
                      ))}
                      className="w-20 p-1 border rounded text-center"
                      min="0"
                      max="100"
                    />
                    <button
                      onClick={() => setWidgets(widgets.map(w =>
                        w.id === widget.id ? { ...w, score: generateRandomScore() } : w
                      ))}
                      className="ml-4 p-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Random
                    </button>
                  </div>
                  <div
                    className="absolute bottom-0 right-0 w-6 h-6 bg-blue-400 cursor-se-resize flex items-center justify-center hover:bg-blue-500"
                    onMouseDown={(e) => handleResize(e, widget)}
                  >
                    <div className="w-3 h-3 border-r-2 border-b-2 border-white transform rotate-45" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GridLayoutPage;