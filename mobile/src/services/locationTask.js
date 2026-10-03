import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import api from '../api/client';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    return;
  }
  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const ping = locations[0];
      try {
        await api.post('/tracking/ping/', {
          lat: ping.coords.latitude,
          lng: ping.coords.longitude,
          recorded_at: new Date(ping.timestamp).toISOString(),
        });
      } catch {
        // Location pings retry or wait until network returns
      }
    }
  }
});

export async function startLocationTracking() {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== 'granted') {
    return false;
  }

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus !== 'granted') {
    return false;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30000, // 30 seconds interval per PRD section 17.3
    distanceInterval: 10,
    foregroundService: {
      notificationTitle: 'Duty tracking active',
      notificationBody: 'Location verification is active during scheduled duty.',
      notificationColor: '#1D4ED8',
    },
  });
  return true;
}

export async function stopLocationTracking() {
  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}
