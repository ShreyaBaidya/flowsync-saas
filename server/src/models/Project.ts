/**
 * Project.ts
 * Mongoose model for FlowSync projects.
 *
 * Access control:
 *  - owner field references the User who created the project
 *  - members array contains User references for collaborators
 *  - Authorization is enforced at the service layer
 */

import { Schema, model, Document, Model, Types } from 'mongoose';
import { ProjectStatus, ProjectPriority, SafeProject } from '../types/project.types';

// ── Document interface ───────────────────────────────────────

export interface IProject extends Document {
  owner:        Types.ObjectId;
  name:         string;
  description:  string;
  status:       ProjectStatus;
  priority:     ProjectPriority;
  startDate:    Date | null;
  dueDate:      Date | null;
  members:      Types.ObjectId[];
  tags:         string[];
  color:        string;
  createdAt:    Date;
  updatedAt:    Date;

  toSafeObject(): SafeProject;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IProjectModel extends Model<IProject> {}

// ── Schema ───────────────────────────────────────────────────

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
      type:     String,
      trim:     true,
      default:  '',
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    status: {
      type:    String,
      enum:    ['active', 'completed', 'archived'],
      default: 'active',
    },
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high'],
      default: 'medium',
    },
    startDate: {
      type:    Date,
      default: null,
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
      match:   [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #6C63FF)'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ── Indexes ──────────────────────────────────────────────────

// Compound index for owner + status — common query pattern
projectSchema.index({ owner: 1, status: 1 });
// Text index for name search
projectSchema.index({ name: 'text', description: 'text' });

// ── Instance methods ──────────────────────────────────────────

projectSchema.methods.toSafeObject = function (this: IProject): SafeProject {
  return {
    id:          (this._id as { toString(): string }).toString(),
    owner:       this.owner.toString(),
    name:        this.name,
    description: this.description,
    status:      this.status,
    priority:    this.priority,
    startDate:   this.startDate ? this.startDate.toISOString() : null,
    dueDate:     this.dueDate   ? this.dueDate.toISOString()   : null,
    members:     this.members.map(m => m.toString()),
    tags:        this.tags,
    color:       this.color,
    createdAt:   this.createdAt.toISOString(),
    updatedAt:   this.updatedAt.toISOString(),
  };
};

// ── Model export ─────────────────────────────────────────────

export const Project = model<IProject, IProjectModel>('Project', projectSchema);
