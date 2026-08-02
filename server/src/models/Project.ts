import { Schema, model, Document, Model, Types } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────

export type ProjectStatus   = 'active' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high';

export interface SafeProject {
  id:          string;
  owner:       string;
  name:        string;
  description: string;
  status:      ProjectStatus;
  priority:    ProjectPriority;
  dueDate:     string | null;
  members:     string[];
  tags:        string[];
  color:       string;
  createdAt:   string;
  updatedAt:   string;
}

// ── Document interface ────────────────────────────────────────

export interface IProject extends Document {
  _id:         Types.ObjectId;
  owner:       Types.ObjectId;
  name:        string;
  description: string;
  status:      ProjectStatus;
  priority:    ProjectPriority;
  dueDate:     Date | null;
  members:     Types.ObjectId[];
  tags:        string[];
  color:       string;
  createdAt:   Date;
  updatedAt:   Date;

  toSafeObject(): SafeProject;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IProjectModel extends Model<IProject> {}

// ── Schema ────────────────────────────────────────────────────

const projectSchema = new Schema<IProject, IProjectModel>(
  {
    owner: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Project owner is required'],
      index:    true,
    },
    name: {
      type:      String,
      required:  [true, 'Project name is required'],
      trim:      true,
      minlength: [1,   'Project name cannot be empty'],
      maxlength: [120, 'Project name must be at most 120 characters'],
    },
    description: {
      type:      String,
      trim:      true,
      default:   '',
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    status: {
      type:    String,
      enum:    ['active', 'completed', 'archived'] satisfies ProjectStatus[],
      default: 'active',
    },
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high'] satisfies ProjectPriority[],
      default: 'medium',
    },
    dueDate: {
      type:    Date,
      default: null,
    },
    members: {
      type:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    tags: {
      type:    [String],
      default: [],
    },
    color: {
      type:    String,
      trim:    true,
      default: '#6C63FF',
      match:   [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ── Indexes ───────────────────────────────────────────────────

projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ members: 1 });

// ── Instance methods ──────────────────────────────────────────

projectSchema.methods.toSafeObject = function (this: IProject): SafeProject {
  return {
    id:          this._id.toString(),
    owner:       this.owner.toString(),
    name:        this.name,
    description: this.description,
    status:      this.status,
    priority:    this.priority,
    dueDate:     this.dueDate ? this.dueDate.toISOString() : null,
    members:     this.members.map((m) => m.toString()),
    tags:        this.tags,
    color:       this.color,
    createdAt:   this.createdAt.toISOString(),
    updatedAt:   this.updatedAt.toISOString(),
  };
};

// ── Model export ──────────────────────────────────────────────

export const Project = model<IProject, IProjectModel>('Project', projectSchema);
