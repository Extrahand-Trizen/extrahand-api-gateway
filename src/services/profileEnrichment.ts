import logger from '../config/logger.js';
import { userService } from './userService.js';
import { UserToken } from '../types/service.js';

/**
 * Profile enrichment service
 * Enriches task responses with Profile data (name, photoURL, etc.)
 * This is the ONLY place where cross-service data joining happens
 * Uses user-service endpoints to fetch profile data
 */

export interface EnrichedProfileData {
  requesterName?: string;
  requesterPhotoURL?: string | null;
  requesterRating?: number;
  requesterTotalReviews?: number;
  assigneeName?: string;
  assigneePhotoURL?: string | null;
  assigneeRating?: number;
  assigneeTotalReviews?: number;
}

type ProfileSnippet = {
  _id: string;
  name: string;
  photoURL?: string | null;
  rating?: number;
  totalReviews?: number;
};

/**
 * Get Profile data by ObjectId (via user-service)
 */
async function getProfileById(
  profileId: string,
  userToken: UserToken
): Promise<ProfileSnippet | null> {
  try {
    const response = await userService.getProfileById(profileId, userToken);
    
    if (response.data.success && (response.data as any).profile) {
      return (response.data as any).profile;
    }
    
    return null;
  } catch (error: any) {
    logger.warn('Error fetching profile by ObjectId from user-service', {
      profileId,
      error: error.message,
    });
    return null;
  }
}

function toProfileIdString(id: unknown): string | undefined {
  if (id == null) return undefined;
  return typeof id === 'string' ? id : String(id);
}

function applyProfileToTask(
  enriched: Record<string, unknown>,
  profile: ProfileSnippet,
  role: 'requester' | 'assignee',
): void {
  if (role === 'requester') {
    enriched.requesterName = profile.name;
    enriched.requesterPhotoURL = profile.photoURL || null;
    enriched.requesterRating = profile.rating || 0;
    enriched.requesterTotalReviews = profile.totalReviews || 0;
    return;
  }
  enriched.assigneeName = profile.name;
  enriched.assigneePhotoURL = profile.photoURL || null;
  enriched.assigneeRating = profile.rating || 0;
  enriched.assigneeTotalReviews = profile.totalReviews || 0;
}

/**
 * Enrich a single task with Profile data (parallel requester + assignee fetch)
 */
export async function enrichTask(task: any, userToken: UserToken): Promise<any> {
  if (!task) return task;

  const requesterId = toProfileIdString(task.requesterId);
  const assigneeId = toProfileIdString(task.assigneeId);

  const [requesterProfile, assigneeProfile] = await Promise.all([
    requesterId ? getProfileById(requesterId, userToken) : Promise.resolve(null),
    assigneeId ? getProfileById(assigneeId, userToken) : Promise.resolve(null),
  ]);

  const enriched = { ...task };
  if (requesterProfile) {
    applyProfileToTask(enriched, requesterProfile, 'requester');
  }
  if (assigneeProfile) {
    applyProfileToTask(enriched, assigneeProfile, 'assignee');
  }

  return enriched;
}

/**
 * Enrich multiple tasks with Profile data (batch operation)
 * Uses user-service batch endpoint for efficient fetching
 */
export async function enrichTasks(tasks: any[], userToken: UserToken): Promise<any[]> {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return tasks;
  }

  // Collect all unique profile IDs
  const profileIds = new Set<string>();
  
  tasks.forEach(task => {
    const requesterId = toProfileIdString(task.requesterId);
    const assigneeId = toProfileIdString(task.assigneeId);
    if (requesterId) profileIds.add(requesterId);
    if (assigneeId) profileIds.add(assigneeId);
  });

  const profileMap = new Map<string, ProfileSnippet>();
  
  if (profileIds.size > 0) {
    try {
      const profileIdsArray = Array.from(profileIds);
      const response = await userService.getProfilesBatch(profileIdsArray, userToken);
      
      if (response.data.success && Array.isArray((response.data as any).profiles)) {
        (response.data as any).profiles.forEach((profile: ProfileSnippet) => {
          profileMap.set(profile._id.toString(), profile);
        });
      }
    } catch (error: any) {
      logger.error('Error batch fetching profiles from user-service', {
        profileIdsCount: profileIds.size,
        error: error.message,
      });
    }
  }

  return tasks.map(task => {
    const enriched = { ...task };

    const requesterIdStr = toProfileIdString(task.requesterId);
    if (requesterIdStr) {
      const requesterProfile = profileMap.get(requesterIdStr);
      if (requesterProfile) {
        applyProfileToTask(enriched, requesterProfile, 'requester');
      }
    }

    const assigneeIdStr = toProfileIdString(task.assigneeId);
    if (assigneeIdStr) {
      const assigneeProfile = profileMap.get(assigneeIdStr);
      if (assigneeProfile) {
        applyProfileToTask(enriched, assigneeProfile, 'assignee');
      }
    }

    return enriched;
  });
}

/**
 * Enrich task response (handles both single task and task arrays)
 * Requires userToken for service-to-service authentication
 */
export async function enrichTaskResponse(response: any, userToken: UserToken): Promise<any> {
  if (!response) return response;

  // Handle array of tasks
  if (Array.isArray(response)) {
    return await enrichTasks(response, userToken);
  }

  // Handle response with tasks property
  if (response.tasks && Array.isArray(response.tasks)) {
    const enrichedTasks = await enrichTasks(response.tasks, userToken);
    return {
      ...response,
      tasks: enrichedTasks,
    };
  }

  // Handle single task
  if (response._id || response.id) {
    return await enrichTask(response, userToken);
  }

  // Unknown format - return as is
  return response;
}
