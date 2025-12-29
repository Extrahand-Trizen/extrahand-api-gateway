import mongoose from 'mongoose';
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

/**
 * Get Profile data by ObjectId (via user-service)
 */
async function getProfileById(
  profileId: string,
  userToken: UserToken
): Promise<{
  _id: string;
  name: string;
  photoURL?: string | null;
  rating?: number;
  totalReviews?: number;
} | null> {
  try {
    const response = await userService.getProfileById(profileId, userToken);
    
    if (response.data.success && response.data.profile) {
      return response.data.profile;
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

/**
 * Enrich a single task with Profile data
 */
export async function enrichTask(task: any, userToken: UserToken): Promise<any> {
  if (!task) return task;

  const enriched = { ...task };

  // Enrich requester data
  if (task.requesterId) {
    try {
      const requesterId = typeof task.requesterId === 'string'
        ? task.requesterId
        : task.requesterId.toString();

      const requesterProfile = await getProfileById(requesterId, userToken);
      if (requesterProfile) {
        enriched.requesterName = requesterProfile.name;
        enriched.requesterPhotoURL = requesterProfile.photoURL || null;
        enriched.requesterRating = requesterProfile.rating || 0;
        enriched.requesterTotalReviews = requesterProfile.totalReviews || 0;
      }
    } catch (error: any) {
      logger.warn('Failed to enrich requester profile', {
        requesterId: task.requesterId,
        error: error.message,
      });
    }
  }

  // Enrich assignee data
  if (task.assigneeId) {
    try {
      const assigneeId = typeof task.assigneeId === 'string'
        ? task.assigneeId
        : task.assigneeId.toString();

      const assigneeProfile = await getProfileById(assigneeId, userToken);
      if (assigneeProfile) {
        enriched.assigneeName = assigneeProfile.name;
        enriched.assigneePhotoURL = assigneeProfile.photoURL || null;
        enriched.assigneeRating = assigneeProfile.rating || 0;
        enriched.assigneeTotalReviews = assigneeProfile.totalReviews || 0;
      }
    } catch (error: any) {
      logger.warn('Failed to enrich assignee profile', {
        assigneeId: task.assigneeId,
        error: error.message,
      });
    }
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
    if (task.requesterId) {
      const id = typeof task.requesterId === 'string' 
        ? task.requesterId 
        : task.requesterId.toString();
      profileIds.add(id);
    }
    if (task.assigneeId) {
      const id = typeof task.assigneeId === 'string'
        ? task.assigneeId
        : task.assigneeId.toString();
      profileIds.add(id);
    }
  });

  // Fetch all profiles in batch via user-service
  const profileMap = new Map<string, {
    _id: string;
    name: string;
    photoURL?: string | null;
    rating?: number;
    totalReviews?: number;
  }>();
  
  if (profileIds.size > 0) {
    try {
      const profileIdsArray = Array.from(profileIds);
      const response = await userService.getProfilesBatch(profileIdsArray, userToken);
      
      if (response.data.success && Array.isArray(response.data.profiles)) {
        response.data.profiles.forEach((profile: any) => {
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

  // Enrich each task
  return tasks.map(task => {
    const enriched = { ...task };

    // Enrich requester
    if (task.requesterId) {
      const requesterIdStr = typeof task.requesterId === 'string'
        ? task.requesterId
        : task.requesterId.toString();
      
      const requesterProfile = profileMap.get(requesterIdStr);
      if (requesterProfile) {
        enriched.requesterName = requesterProfile.name;
        enriched.requesterPhotoURL = requesterProfile.photoURL || null;
        enriched.requesterRating = requesterProfile.rating || 0;
        enriched.requesterTotalReviews = requesterProfile.totalReviews || 0;
      }
    }

    // Enrich assignee
    if (task.assigneeId) {
      const assigneeIdStr = typeof task.assigneeId === 'string'
        ? task.assigneeId
        : task.assigneeId.toString();
      
      const assigneeProfile = profileMap.get(assigneeIdStr);
      if (assigneeProfile) {
        enriched.assigneeName = assigneeProfile.name;
        enriched.assigneePhotoURL = assigneeProfile.photoURL || null;
        enriched.assigneeRating = assigneeProfile.rating || 0;
        enriched.assigneeTotalReviews = assigneeProfile.totalReviews || 0;
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

