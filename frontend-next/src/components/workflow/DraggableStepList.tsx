'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowDown } from 'lucide-react';

// ── Sortable Step Item ─────────────────────────────────────────────────────

interface SortableStepProps {
  id: string;
  children: React.ReactNode;
}

export function SortableStep({ id, children }: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute left-[-28px] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 rounded-lg text-slate-300 hover:text-slate-500 transition-opacity z-10"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}

// ── DnD Step List ──────────────────────────────────────────────────────────

// Generic type is used below

interface DraggableStepListProps<T extends { id: string }> {
  steps: T[];
  onReorder: (newSteps: T[]) => void;
  renderStep: (step: T, index: number, isLast: boolean) => React.ReactNode;
}

/**
 * DraggableStepList — wraps workflow steps in dnd-kit context.
 *
 * Provides drag-and-drop reordering with:
 * - Mouse/touch pointer sensor
 * - Keyboard accessibility (Space/Enter to grab, arrows to move)
 * - Visual drag ghost with reduced opacity
 * - Animated snap-back on drop
 * - Grip handle that appears on hover
 *
 * INSTALLATION:
 *   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
 */
export function DraggableStepList<T extends { id: string }>({ steps, onReorder, renderStep }: DraggableStepListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex(s => s.id === active.id);
    const newIndex = steps.findIndex(s => s.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(steps, oldIndex, newIndex));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0 pl-8">
          {steps.map((step, i) => (
            <div key={step.id}>
              <SortableStep id={step.id}>
                {renderStep(step, i, i === steps.length - 1)}
              </SortableStep>
              {i < steps.length - 1 && (
                <div className="flex justify-center my-1">
                  <ArrowDown className="h-4 w-4 text-slate-300" />
                </div>
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
