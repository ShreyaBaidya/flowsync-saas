/**
 * dashboardService.ts
 * Business logic for the Dashboard summary endpoint.
 *
 * Returns aggregated metrics for all projects the user owns or is a
 * member of, plus a recent-activity feed derived from recently
 * modified tasks and projects.
 */

import { Types } from 'mongoose';
import { Project } from '../models/Project';
import { Task }    from '../models/Task';

// ── Response shape ────────────────────────────────────────────

export interface ActivityItem {
  id:        string;
  text:      string;
  type:      'task' | 'project';
  time:      string; // ISO timestamp
}

export interface DashboardSummary {
  totalProjects:        number;
  totalTasks:           number;
  completedTasks:       number;
  pendingTasks:         number;
  overdueTasks:         number;
  completionPercentage: number;
  recentActivity:       ActivityItem[];
}

// ── Main service function ─────────────────────────────────────

export async function getDashboardSummary(
  userId: string,
): Promise<DashboardSummary> {
  const userOid = new Types.ObjectId(userId);

  // ── 1. Fetch all projects the user can access ─────────────
  const projects = await Project.find({
    $or: [{ owner: userOid }, { members: userOid }],
  })
    .select('_id name status updatedAt')
    .lean();

  const totalProjects = projects.length;
  const projectIds    = projects.map(p => p._id);

  // ── 2. Aggregate task counts in one query ─────────────────
  type AggResult = { _id: string; count: number };

  const taskAgg: AggResult[] = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const countByStatus: Record<string, number> = {};
  taskAgg.forEach(({ _id, count }) => { countByStatus[_id] = count; });

  const totalTasks     = taskAgg.reduce((s, r) => s + r.count, 0);
  const completedTasks = countByStatus['done'] ?? 0;
  // pending = everything that is not done
  const pendingTasks   = totalTasks - completedTasks;

  const completionPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // ── 3. Overdue tasks ─────────────────────────────────────
  // A task is overdue when it has a dueDate in the past and is not done
  const now = new Date();
  const overdueTasks = await Task.countDocuments({
    project: { $in: projectIds },
    status:  { $nin: ['done'] },
    dueDate: { $lt: now, $ne: null },
  });

  // ── 4. Recent activity (last 10 events) ──────────────────
  // Derive from recently updated tasks and projects (mixed, sorted by time)
  const [recentTasks, recentProjects] = await Promise.all([
    Task.find({ project: { $in: projectIds } })
      .select('_id title status updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean(),
    Project.find({ $or: [{ owner: userOid }, { members: userOid }] })
      .select('_id name status updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const taskEvents: ActivityItem[] = recentTasks.map(t => {
    const isNew    = (t.updatedAt as Date).getTime() - (t.createdAt as Date).getTime() < 5000;
    const statusLabel: Record<string, string> = {
      todo:        'added to To Do',
      in_progress: 'moved to In Progress',
      in_review:   'moved to In Review',
      done:        'marked as Done',
    };
    const action = isNew
      ? 'created'
      : (statusLabel[t.status as string] ?? 'updated');
    return {
      id:   (t._id as Types.ObjectId).toString(),
      text: `Task "${t.title}" ${action}`,
      type: 'task',
      time: (t.updatedAt as Date).toISOString(),
    };
  });

  const projectEvents: ActivityItem[] = recentProjects.map(p => {
    const isNew    = (p.updatedAt as Date).getTime() - (p.createdAt as Date).getTime() < 5000;
    const action   = isNew ? 'created' : `updated (${p.status})`;
    return {
      id:   (p._id as Types.ObjectId).toString(),
      text: `Project "${p.name}" ${action}`,
      type: 'project',
      time: (p.updatedAt as Date).toISOString(),
    };
  });

  // Merge and return the 10 most recent events across both types
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
