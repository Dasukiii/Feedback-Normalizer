import { supabase } from '../lib/supabase';

export interface Request {
  id: string;
  user_id: string;
  requester_name: string;
  requester_email?: string;
  requester_department?: string;
  raw_feedback: string;
  description?: string;
  category?: string;
  priority: string;
  status: string;
  source: string;
  owner_id?: string;
  suggested_owner?: string;
  due_date?: string;
  tags?: string[];
  attachments?: any;
  created_at: string;
  updated_at: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  creator?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface Comment {
  id: string;
  request_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'urgent' | 'assignment' | 'comment' | 'status_update' | 'due_date';
  title: string;
  message: string;
  request_id?: string;
  is_read: boolean;
  created_at: string;
  created_by?: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string;
  request_id: string;
  action_type: string;
  old_value?: string;
  new_value?: string;
  description: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  company_name?: string;
  role?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  request_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface CreateRequestData {
  requester_name: string;
  requester_email?: string;
  requester_department?: string;
  raw_feedback: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  source?: string;
  owner_id?: string;
  suggested_owner?: string;
  due_date?: string;
  tags?: string[];
  attachments?: any;
}

export interface UpdateRequestData {
  requester_name?: string;
  requester_email?: string;
  requester_department?: string;
  raw_feedback?: string;
  description?: string;
  category?: string;
  priority?: string;
  status?: string;
  source?: string;
  owner_id?: string;
  suggested_owner?: string;
  due_date?: string;
  tags?: string[];
  attachments?: any;
}

export const getRequests = async (filters?: {
  status?: string;
  priority?: string;
  owner_id?: string;
  category?: string;
}): Promise<Request[]> => {
  let query = supabase
    .from('requests')
    .select(`
      *,
      owner:owner_id (id, name, email, role),
      creator:user_id (id, name, email, role)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.owner_id) {
    query = query.eq('owner_id', filters.owner_id);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const getRequestById = async (id: string): Promise<Request | null> => {
  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      owner:owner_id (id, name, email, role),
      creator:user_id (id, name, email, role)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createRequest = async (requestData: CreateRequestData): Promise<Request> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('requests')
    .insert({
      ...requestData,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity({
    request_id: data.id,
    action_type: 'created',
    description: `Request created for ${requestData.requester_name}`,
  });

  return data;
};

export const updateRequest = async (
  id: string,
  updates: UpdateRequestData
): Promise<Request> => {
  const { data, error } = await supabase
    .from('requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (updates.status) {
    const oldRequest = await getRequestById(id);
    await logActivity({
      request_id: id,
      action_type: 'status_changed',
      old_value: oldRequest?.status,
      new_value: updates.status,
      description: `Status changed from ${oldRequest?.status} to ${updates.status}`,
    });
  }

  if (updates.owner_id) {
    await logActivity({
      request_id: id,
      action_type: 'assigned',
      new_value: updates.owner_id,
      description: `Request assigned`,
    });
  }

  return data;
};

export const deleteRequest = async (id: string): Promise<void> => {
  try {
    await logActivity({
      request_id: id,
      action_type: 'deleted',
      description: 'Request deleted',
    });
  } catch (error) {
    console.log('Failed to log activity, continuing with deletion');
  }

  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const deleteRequests = async (ids: string[]): Promise<void> => {
  for (const id of ids) {
    try {
      await logActivity({
        request_id: id,
        action_type: 'deleted',
        description: 'Request deleted (batch)',
      });
    } catch (error) {
      console.log('Failed to log activity for request', id);
    }
  }

  const { error } = await supabase
    .from('requests')
    .delete()
    .in('id', ids);

  if (error) throw error;
};

export const getComments = async (requestId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const addComment = async (
  requestId: string,
  content: string,
  isInternal: boolean = true
): Promise<Comment> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      request_id: requestId,
      user_id: user.id,
      content,
      is_internal: isInternal,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity({
    request_id: requestId,
    action_type: 'comment_added',
    description: `Added ${isInternal ? 'internal' : 'public'} note`,
  });

  return data;
};

export const getActivityLog = async (requestId?: string): Promise<ActivityLog[]> => {
  let query = supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false });

  if (requestId) {
    query = query.eq('request_id', requestId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const logActivity = async (activity: {
  request_id: string;
  action_type: string;
  old_value?: string;
  new_value?: string;
  description: string;
}): Promise<ActivityLog> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('activity_log')
    .insert({
      user_id: user.id,
      request_id: activity.request_id,
      action_type: activity.action_type,
      old_value: activity.old_value,
      new_value: activity.new_value,
      description: activity.description,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getNotifications = async (unreadOnly: boolean = false): Promise<Notification[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
};

export const createNotification = async (notification: {
  user_id: string;
  type: Notification['type'];
  title: string;
  message: string;
  request_id?: string;
  created_by?: string;
}): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      request_id: notification.request_id,
      created_by: notification.created_by,
      is_read: false,
    });

  if (error) throw error;
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getProfile(user.id);
  return profile;
};

export const updateRequestStatus = async (
  id: string,
  status: string
): Promise<Request> => {
  const oldRequest = await getRequestById(id);

  const { data, error } = await supabase
    .from('requests')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await logActivity({
    request_id: id,
    action_type: 'status_changed',
    old_value: oldRequest?.status,
    new_value: status,
    description: `Status changed from ${oldRequest?.status} to ${status}`,
  });

  return data;
};

export const assignRequest = async (
  id: string,
  ownerId: string | null
): Promise<Request> => {
  const { data, error } = await supabase
    .from('requests')
    .update({
      owner_id: ownerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (ownerId) {
    await logActivity({
      request_id: id,
      action_type: 'assigned',
      new_value: ownerId,
      description: `Request assigned`,
    });
  } else {
    await logActivity({
      request_id: id,
      action_type: 'unassigned',
      description: `Request unassigned`,
    });
  }

  return data;
};

export const getCommentsWithProfiles = async (requestId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (id, name, email)
    `)
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getActivityLogWithProfiles = async (requestId: string) => {
  const { data, error } = await supabase
    .from('activity_log')
    .select(`
      *,
      profiles:user_id (id, name, email)
    `)
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getMyAssignments = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      owner:owner_id (id, name, email, role),
      creator:user_id (id, name, email, role)
    `)
    .eq('owner_id', user.id)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data || [];
};

export const getActivityFeed = async (filters?: {
  actionType?: string;
  dateRange?: string;
  userId?: string;
  searchQuery?: string;
  limit?: number;
}) => {
  let query = supabase
    .from('activity_log')
    .select(`
      *,
      profiles:user_id (id, name, email),
      requests:request_id (id, requester_name, description)
    `)
    .order('created_at', { ascending: false });

  if (filters?.actionType && filters.actionType !== 'all') {
    query = query.eq('action_type', filters.actionType);
  }

  if (filters?.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    let startDate = new Date();

    switch (filters.dateRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    query = query.gte('created_at', startDate.toISOString());
  }

  if (filters?.userId && filters.userId !== 'all') {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  } else {
    query = query.limit(100);
  }

  const { data, error } = await query;

  if (error) throw error;

  let activities = data || [];

  if (filters?.searchQuery) {
    const search = filters.searchQuery.toLowerCase();
    activities = activities.filter(
      (a) =>
        a.description?.toLowerCase().includes(search) ||
        a.details?.toLowerCase().includes(search) ||
        a.requests?.requester_name?.toLowerCase().includes(search)
    );
  }

  return activities;
};

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getManagers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .in('role', ['manager', 'admin'])
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getActivityStats = async (userId?: string) => {
  let query = supabase.from('activity_log').select('*');

  if (userId && userId !== 'all') {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) throw error;

  const activities = data || [];
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return {
    total: activities.length,
    last24h: activities.filter((a) => new Date(a.created_at) >= last24h).length,
    byType: activities.reduce((acc, a) => {
      acc[a.action_type] = (acc[a.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
};

export const getAssignmentStats = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: allAssignments, error: allError } = await supabase
    .from('requests')
    .select('*')
    .eq('owner_id', user.id);

  if (allError) throw allError;

  const assignments = allAssignments || [];

  const openCount = assignments.filter(r =>
    r.status === 'in_progress'
  ).length;

  const inProgressCount = assignments.filter(r =>
    r.status === 'in_progress'
  ).length;

  const dueThisWeek = assignments.filter(r =>
    r.due_date && new Date(r.due_date) <= weekFromNow && new Date(r.due_date) >= now
  ).length;

  const overdue = assignments.filter(r =>
    r.due_date && new Date(r.due_date) < now &&
    r.status !== 'resolved' && r.status !== 'closed'
  ).length;

  const thisMonthResolved = assignments.filter(r => {
    const updatedDate = new Date(r.updated_at);
    return r.status === 'resolved' && updatedDate >= monthAgo;
  }).length;

  const totalResolved = assignments.filter(r =>
    r.status === 'resolved' || r.status === 'closed'
  ).length;

  const completionRate = assignments.length > 0
    ? Math.round((totalResolved / assignments.length) * 100)
    : 0;

  const resolvedWithDates = assignments.filter(r => {
    return (r.status === 'resolved' || r.status === 'closed') &&
           r.created_at && r.updated_at;
  });

  let avgResponseTime = 0;
  if (resolvedWithDates.length > 0) {
    const totalTime = resolvedWithDates.reduce((sum, r) => {
      const created = new Date(r.created_at).getTime();
      const updated = new Date(r.updated_at).getTime();
      return sum + (updated - created);
    }, 0);
    avgResponseTime = Math.round(totalTime / resolvedWithDates.length / (1000 * 60 * 60));
  }

  const onTimeCount = assignments.filter(r => {
    if (!r.due_date || (r.status !== 'resolved' && r.status !== 'closed')) return false;
    return new Date(r.updated_at) <= new Date(r.due_date);
  }).length;

  const onTimeRate = totalResolved > 0
    ? Math.round((onTimeCount / totalResolved) * 100)
    : 0;

  return {
    openCount,
    inProgressCount,
    dueThisWeek,
    overdue,
    totalOpen: openCount + inProgressCount,
    avgResponseTime,
    completionRate,
    thisMonthResolved,
    onTimeRate,
  };
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
};
