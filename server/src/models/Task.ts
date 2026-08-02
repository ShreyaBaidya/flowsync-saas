import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────

export type TaskStatus   = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface SafeTask {
  id:          string;
  project:     string;
  createdBy:   string;
  title:       string;
  description: string;
  status:      TaskStatus;
  priority:    TaskPriority;
  assignee:    string | null;
  dueDate:     string | null;
  tags:        string[];
  order:       number;
  createdAt:   string;
  updatedAt:   string;
}

// ── Document interface ────────────────────────────────────────

export interface ITask extends Document {
  _id:         Types.ObjectId;
  project:     Types.ObjectId;
  createdBy:   Types.ObjectId;
  title:       string;
  description: string;
  status:      TaskStatus;
  priority:    TaskPriority;
  assignee:    Types.ObjectId | null;
  dueDate:     Date | null;
  tags:        string[];
  order:       number;
  createdAt:   Date;
  updatedAt:   Date;

  toSafeObject(): SafeTask;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ITaskModel extends Model<ITask> {}

// ── Schema ────────────────────────────────────────────────────

const taskSchema = new Schema<ITask, ITaskModel>(
  {
    project: {
      type:     Schema.Types.ObjectId,
      ref:      'Project',
      required: [true, 'Task must belong to a project'],
      index:    true,
    },
    createdBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Task creator is required'],
      index:    true,
    },
    title: {
      type:      String,
      required:  [true, 'Task title is required'],
      trim:      true,
      minlength: [1,   'Task title cannot be empty'],
      maxlength: [200, 'Task title must be at most 200 characters'],
    },
    description: {
      type:      String,
      trim:      true,
      default:   '',
      maxlength: [5000, 'Description must be at most 5000 characters'],
    },
    status: {
      type:    String,
      enum:    ['todo', 'in_progress', 'in_review', 'done'] satisfies TaskStatus[],
      default: 'todo',
    },
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high'] satisfies TaskPriority[],
      default: 'medium',
    },
    assignee: {
      type:    Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    dueDate: {
      type:    Date,
      default: null,
    },
    tags: {
      type:    [String],
      default: [],
    },
    order: {
      type:    Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ── Indexes ───────────────────────────────────────────────────

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ project: 1, order:  1 });
taskSchema.index({ assignee: 1 });

// ── Instance methods ──────────────────────────────────────────

taskSchema.methods.toSafeObject = function (this: ITask): SafeTask {
  return {
    id:          this._id.toString(),
    project:     this.project.toString(),
    createdBy:   this.createdBy.toString(),
    title:       this.title,
    description: this.description,
    status:      this.status,
    priority:    this.priority,
    assignee:    this.assignee ? this.assignee.toString() : null,
    dueDate:     this.dueDate ? this.dueDate.toISOString() : null,
    tags:        this.tags,
    order:       this.order,
    createdAt:   this.createdAt.toISOString(),
    updatedAt:   this.updatedAt.toISOString(),
  };
};

// ── Model export ──────────────────────────────────────────────

export const Task = model<ITask, ITaskModel>('Task', taskSchema);
