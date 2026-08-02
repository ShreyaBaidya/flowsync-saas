import { Schema, model, Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { SafeUser, UserRole, UserPlan } from '../types/user.types';

// ── Document interface ────────────────────────────────────────

export interface IUser extends Document {
  _id:             Types.ObjectId;
  name:            string;
  email:           string;
  password:        string;
  avatar:          string | null;
  role:            UserRole;
  plan:            UserPlan;
  isEmailVerified: boolean;
  createdAt:       Date;
  updatedAt:       Date;

  comparePassword(candidate: string): Promise<boolean>;
  toSafeObject(): SafeUser;
}

// ── Model interface ───────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IUserModel extends Model<IUser> {}

// ── Schema ────────────────────────────────────────────────────

const userSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type:     String,
      required: [true, 'Password is required'],
      select:   false, // never returned in queries unless explicitly requested
    },

    avatar: {
      type:    String,
      default: null,
      trim:    true,
    },

    role: {
      type:    String,
      enum:    ['user', 'admin'] satisfies UserRole[],
      default: 'user',
    },

    plan: {
      type:    String,
      enum:    ['starter', 'pro'] satisfies UserPlan[],
      default: 'starter',
    },

    isEmailVerified: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ── Indexes ───────────────────────────────────────────────────

// email is already indexed via unique: true
// Composite index for common admin queries (filter by role + plan)
userSchema.index({ role: 1, plan: 1 });

// ── Pre-save hook — hash password ─────────────────────────────

userSchema.pre<IUser>('save', async function (next) {
  // Only hash when the password field has been set or changed
  if (!this.isModified('password')) return next();

  const salt    = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// ── Instance methods ──────────────────────────────────────────

userSchema.methods.comparePassword = async function (
  this: IUser,
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function (this: IUser): SafeUser {
  return {
    id:              this._id.toString(),
    name:            this.name,
    email:           this.email,
    avatar:          this.avatar,
    role:            this.role,
    plan:            this.plan,
    isEmailVerified: this.isEmailVerified,
    createdAt:       this.createdAt.toISOString(),
    updatedAt:       this.updatedAt.toISOString(),
  };
};

// ── Model export ──────────────────────────────────────────────

export const User = model<IUser, IUserModel>('User', userSchema);
