import { Types } from 'mongoose';
import { Project } from '../models/Project';
import { Task } from '../models/Task';

// ── Response shape ────────────────────────────────────────────

export interface ActivityItem {
  id:   string;
  text: string;
  type: 'task' | 'project';
  time: string;
}

export interface DashboardStats {
  totalProjects:        number;
  totalTasks:           number;
  completedTasks:       number;
  pendingTasks:         number;
  overdueTasks:         number;
  completionPercentage: number;
  recentActivity:       ActivityItem[];
}

// ── Service function ──────────────────────────────────────────

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const userOid = new Types.ObjectId(userId);

  // All projects the user owns or belongs to
  const projects = await Project.find({
    $or: [{ owner: userOid }, { members: userOid }],
  }).select('_id name status updatedAt createdAt').lean();

  const totalProjects = projects.length;
  const projectIds    = projects.map((p) => p._id);

  // Aggregate task counts by status in a single pass
  type AggRow = { _id: string; count: number };

  const agg: AggRow[] = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const byStatus: Record<string, number> = {};
  agg.forEach(({ _id, count }) => { byStatus[_id] = count; });

  const totalTasks     = agg.reduce((sum, r) => sum + r.count, 0);
  const completedTasks = byStatus['done'] ?? 0;
  const pendingTasks   = totalTasks - completedTasks;

  const completionPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // Overdue: dueDate in the past, not done
  const overdueTasks = await Task.countDocuments({
    project: { $in: projectIds },
    status:  { $ne: 'done' },
    dueDate: { $lt: new Date(), $ne: null },
  });

  // Recent activity — last 10 events across tasks and projects
  const [recentTasks, recentProjects] = await Promise.all([
    Task.find({ project: { $in: projectIds } })
      .select('_id title status updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
    Project.find({ $or: [{ owner: userOid }, { members: userOid }] })
      .select('_id name status updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const statusLabel: Record<string, string> = {
    todo:        'added to To Do',
    in_progress: 'moved to In Progress',
    in_review:   'moved to In Review',
    done:        'marked as Done',
  };

  const taskEvents: ActivityItem[] = recentTasks.map((t) => {
    const isNew = (t.updatedAt as Date).getTime() - (t.createdAt as Date).getTime() < 5000;
    const action = isNew
      ? 'created'
      : (statusLabel[t.status as string] ?? 'updated');
    return {
      id:   (t._id as Types.ObjectId).toString(),
      text: `Task "${t.title as string}" ${action}`,
      type: 'task' as const,
      time: (t.updatedAt as Date).toISOString(),
    };
  });

  const projectEvents: ActivityItem[] = recentProjects.map((p) => {
    const isNew = (p.updatedAt as Date).getTime() - (p.createdAt as Date).getTime() < 5000;
    const action = isNew ? 'created' : `updated (${p.status as string})`;
    return {
      id:   (p._id as Types.ObjectId).toString(),
      text: `Project "${p.name as string}" ${action}`,
      type: 'project' as const,
      time: (p.updatedAt as Date).toISOString(),
    };
  });

  const recentActivity = [...taskEvents, ...projectEvents]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionPercentage,
    recentActivity,
  };
}
