/**
 * hooks/useDoctorQueue.js — Extracts queue fetching and Socket.IO subscription logic.
 * Used by Queue.jsx and TodayQueueWidget.jsx.
 */

import { useState, useEffect, useCallback } from 'react';
import * as queueService from '../services/queue.service';
import { joinDoctorQueue, onSocketEvent } from '../services/socket';
import api from '../services/api';

const toDateStr = (d) => d.toISOString().split('T')[0];

export default function useDoctorQueue() {
  const [queue, setQueue] = useState([]);
  const [doctorId, setDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const today = toDateStr(new Date());

  // Get the doctor's profile ID
  useEffect(() => {
    let mounted = true;
    api.get('/doctors/me').then((res) => {
      const doc = res.data || res;
      if (mounted) setDoctorId(doc?.id);
    }).catch(async () => {
      // Fallback
      if (mounted) setDoctorId(null);
    });
    return () => { mounted = false; };
  }, []);

  const fetchQueue = useCallback(async () => {
    if (!doctorId) return;
    try {
      const res = await queueService.getDoctorQueue(doctorId, today);
      const qData = res.data || res;
      setQueue(Array.isArray(qData) ? qData : qData?.queue || []);
    } catch (err) {
      console.error('[useDoctorQueue]', err);
    } finally {
      setLoading(false);
    }
  }, [doctorId, today]);

  useEffect(() => {
    if (!doctorId) return;
    fetchQueue();
    joinDoctorQueue(doctorId, today);
    setIsLive(true);

    const off = onSocketEvent('queue:updated', (payload) => {
      if (payload.doctorId === doctorId && payload.date === today) {
        setQueue(payload.queue || []);
      }
    });

    return () => {
      off();
      setIsLive(false);
    };
  }, [doctorId, today, fetchQueue]);

  const stats = {
    waiting: queue.filter((t) => t.status === 'WAITING').length,
    called: queue.filter((t) => t.status === 'CALLED').length,
    inProgress: queue.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: queue.filter((t) => t.status === 'COMPLETED').length,
    total: queue.filter((t) => t.status !== 'CANCELLED').length,
  };

  return {
    queue,
    stats,
    loading,
    isLive,
    doctorId,
    today,
    fetchQueue,
  };
}
