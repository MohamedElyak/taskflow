import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import TaskCard from '../tasks/TaskCard';
import { STATUSES } from '../../utils/constants';
import { canEditTask } from '../../utils/format';

export default function KanbanBoard({ tasks, role, user, readOnly = false, onMove, onOpen }) {
  function handleDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const task = tasks.find((t) => String(t.id) === draggableId);
    if (task) onMove(task, destination.droppableId);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* Horizontal scroll with snapping keeps the board usable on phones. */}
      <div className="kanban-scroll -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {STATUSES.map((col) => {
          const items = tasks.filter((t) => t.status === col.value);

          return (
            <section key={col.value} aria-label={`${col.label}, ${items.length} tasks`} className="kanban-col flex w-[78vw] max-w-80 shrink-0 flex-col rounded-xl bg-sunken lg:w-auto lg:max-w-none">
              <header className="flex items-center gap-2 px-3 pb-2 pt-3">
                <span className={`size-2.5 rounded-full ${col.bar}`} aria-hidden />
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">{items.length}</span>
              </header>

              <Droppable droppableId={col.value}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-28 flex-1 space-y-2 rounded-b-xl p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-accent-soft' : ''}`}
                  >
                    {items.map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index} isDragDisabled={readOnly || !canEditTask(role, task, user)}>
                        {(p, s) => <TaskCard task={task} onOpen={onOpen} innerRef={p.innerRef} dragging={s.isDragging} dragProps={{ ...p.draggableProps, ...p.dragHandleProps }} />}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && !snapshot.isDraggingOver && <p className="px-2 py-6 text-center text-xs text-muted">No tasks</p>}
                  </div>
                )}
              </Droppable>
            </section>
          );
        })}
      </div>
    </DragDropContext>
  );
}
