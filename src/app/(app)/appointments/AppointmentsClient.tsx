'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { EventCalendar, eventCalendarClasses } from '@mui/x-scheduler';
import { tr } from 'date-fns/locale';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Chip, Snackbar, Alert, Paper,
} from '@mui/material';
import { Add, CalendarMonth } from '@mui/icons-material';

interface AppointmentsClientProps {
  appointments: any[];
  role: string;
  userId: string;
  lawyers: any[];
  clients: any[];
}

const statusConfig: Record<string, { label: string; color: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  REQUESTED: { label: 'Talep Edildi', color: 'warning' },
  CONFIRMED: { label: 'Onaylandı', color: 'success' },
  CANCELLED: { label: 'İptal', color: 'error' },
  COMPLETED: { label: 'Tamamlandı', color: 'info' },
};

const statusColorMap: Record<string, any> = {
  REQUESTED: 'amber',
  CONFIRMED: 'green',
  CANCELLED: 'red',
  COMPLETED: 'blue',
};

export default function AppointmentsClient({ appointments, role, userId, lawyers, clients }: AppointmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const initialLawyerId = searchParams.get('lawyer') ?? '';

  const [events, setEvents] = useState(() =>
    appointments.map((a) => ({
      id: a.id,
      title: a.topic || 'Randevu',
      start: new Date(a.appointment_date).toISOString(),
      end: new Date(new Date(a.appointment_date).getTime() + (a.duration_minutes || 60) * 60000).toISOString(),
      color: statusColorMap[a.status] || 'teal',
      description: a.notes || '',
    }))
  );
  const [visibleDate, setVisibleDate] = useState(new Date());

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [newAppt, setNewAppt] = useState({ lawyer_id: role === 'lawyer' ? userId : initialLawyerId, client_id: '', topic: '', notes: '', duration_minutes: 60 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCreateFromSlot = useCallback((start: Date, end: Date) => {
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setNewAppt({ lawyer_id: role === 'lawyer' ? userId : initialLawyerId, client_id: '', topic: '', notes: '', duration_minutes: Math.round((end.getTime() - start.getTime()) / 60000) });
    setOpenDialog(true);
  }, [role, userId, initialLawyerId]);

  const handleEventClick = useCallback((event: any) => {
    const appt = appointments.find((a) => a.id === event.id);
    if (appt) {
      setSelectedEvent(appt);
      setSelectedSlot(null);
      setOpenDialog(true);
    }
  }, [appointments]);

  const handleCalendarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // Event click
    const eventEl = target.closest(`.${eventCalendarClasses.timeGridEvent}`) || target.closest(`.${eventCalendarClasses.dayGridEvent}`);
    if (eventEl) {
      const titleEl = eventEl.querySelector(`.${eventCalendarClasses.timeGridEventTitle}`) || eventEl.querySelector(`.${eventCalendarClasses.dayGridEventTitle}`);
      const title = titleEl?.textContent?.trim();
      if (title) {
        const event = events.find((ev) => ev.title === title);
        if (event) {
          handleEventClick(event);
          return;
        }
      }
    }

    // Slot click
    const interactiveLayer = target.closest(`.${eventCalendarClasses.dayTimeGridColumnInteractiveLayer}`);
    if (interactiveLayer) {
      const columnEl = interactiveLayer.closest(`.${eventCalendarClasses.dayTimeGridColumn}`);
      if (columnEl) {
        const columns = columnEl.parentElement?.querySelectorAll(`.${eventCalendarClasses.dayTimeGridColumn}`);
        if (columns) {
          const columnIndex = Array.from(columns).indexOf(columnEl);
          const dayDate = new Date(visibleDate);
          dayDate.setDate(dayDate.getDate() + columnIndex);
          const rect = (interactiveLayer as HTMLElement).getBoundingClientRect();
          const yRatio = (e.clientY - rect.top) / rect.height;
          const hour = Math.floor(Math.max(0, Math.min(23, yRatio * 24)));
          const minute = Math.floor((Math.max(0, Math.min(23, yRatio * 24)) * 60) % 60 / 15) * 15;
          dayDate.setHours(hour, minute, 0, 0);
          const endDate = new Date(dayDate.getTime() + 60 * 60000);
          handleCreateFromSlot(dayDate, endDate);
        }
      }
    }
  }, [events, handleEventClick, handleCreateFromSlot, visibleDate]);

  const handleEventsChange = useCallback((value: any[], eventDetails: any) => {
    // Detect new event creation from slot click
    const oldIds = new Set(events.map((e) => e.id));
    const newEvent = value.find((e) => !oldIds.has(e.id));
    if (newEvent) {
      const start = new Date(newEvent.start);
      const end = new Date(newEvent.end);
      handleCreateFromSlot(start, end);
      // Revert the auto-created event; we'll add the real one after API response
      setEvents((prev) => prev.filter((e) => e.id !== newEvent.id));
      return;
    }

    // Detect event update (drag or resize)
    const updatedEvent = value.find((v) => {
      const old = events.find((e) => e.id === v.id);
      return old && (old.start !== v.start || old.end !== v.end);
    });
    if (updatedEvent) {
      const appt = appointments.find((a) => a.id === updatedEvent.id);
      if (appt) {
        const duration = Math.round((new Date(updatedEvent.end).getTime() - new Date(updatedEvent.start).getTime()) / 60000);
        updateAppointmentDate(appt.id, updatedEvent.start, duration);
      }
    }
  }, [events, appointments, handleCreateFromSlot]);

  const updateAppointmentDate = async (id: string, startIso: string, duration: number) => {
    try {
      await fetch('/api/appointments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: id, status: 'CONFIRMED' }),
      });
      await supabase.from('appointments').update({ appointment_date: startIso, duration_minutes: duration }).eq('id', id);
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, start: startIso, end: new Date(new Date(startIso).getTime() + duration * 60000).toISOString() }
            : e
        )
      );
      showToast('Randevu güncellendi.');
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreate = async () => {
    const targetLawyerId = role === 'lawyer' ? userId : newAppt.lawyer_id;
    const targetClientId = role === 'lawyer' ? newAppt.client_id : userId;
    if (!targetLawyerId || !targetClientId || !newAppt.topic) {
      showToast('Lütfen tüm zorunlu alanları doldurun.', 'error');
      return;
    }
    setLoading(true);
    try {
      const appointmentDate = selectedSlot ? selectedSlot.start.toISOString() : new Date().toISOString();
      const res = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyer_id: targetLawyerId,
          client_id: targetClientId,
          appointment_date: appointmentDate,
          duration_minutes: newAppt.duration_minutes,
          topic: newAppt.topic,
          notes: newAppt.notes,
          status: role === 'lawyer' ? 'CONFIRMED' : 'REQUESTED',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Randevu oluşturulamadı');
      showToast('Randevu oluşturuldu.');
      setOpenDialog(false);
      setEvents((prev) => [
        ...prev,
        {
          id: data.appointment.id,
          title: newAppt.topic,
          start: appointmentDate,
          end: new Date(new Date(appointmentDate).getTime() + newAppt.duration_minutes * 60000).toISOString(),
          color: statusColorMap[role === 'lawyer' ? 'CONFIRMED' : 'REQUESTED'] || 'teal',
          description: newAppt.notes,
        },
      ]);
      setNewAppt({ lawyer_id: role === 'lawyer' ? userId : '', client_id: '', topic: '', notes: '', duration_minutes: 60 });
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/appointments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: id, status }),
      });
      if (!res.ok) throw new Error('İşlem başarısız');
      showToast(status === 'CONFIRMED' ? 'Randevu onaylandı.' : 'Randevu iptal edildi.');
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, color: statusColorMap[status] || e.color } : e)));
      setOpenDialog(false);
      router.refresh();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Randevular</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedEvent(null); setSelectedSlot(null); setOpenDialog(true); }}>
          {role === 'lawyer' ? 'Randevu Oluştur' : 'Randevu Al'}
        </Button>
      </Box>

      <Paper sx={{ flex: 1, borderRadius: 3, overflow: 'hidden' }}>
        <EventCalendar
          events={events}
          onEventsChange={handleEventsChange}
          eventCreation={false}
          areEventsDraggable={role === 'lawyer'}
          areEventsResizable={role === 'lawyer'}
          defaultView="week"
          views={['day', 'week', 'month']}
          dateLocale={tr}
          visibleDate={visibleDate}
          onVisibleDateChange={(date) => setVisibleDate(new Date(date.value))}
          onClick={handleCalendarClick}
          localeText={{
            today: 'Bugün',
            day: 'Gün',
            week: 'Hafta',
            month: 'Ay',
            agenda: 'Ajanda',
            closeSidePanel: 'Yan paneli kapat',
            openSidePanel: 'Yan paneli aç',
            nextTimeSpan: () => 'Sonraki',
            previousTimeSpan: () => 'Önceki',
            miniCalendarLabel: 'Mini takvim',
            miniCalendarGoToPreviousMonth: 'Önceki ay',
            miniCalendarGoToNextMonth: 'Sonraki ay',
            timeFormat: 'Saat formatı',
            showWeekends: 'Hafta sonlarını göster',
            showWeekNumber: 'Hafta numarasını göster',
            amPm12h: '12 saat',
            hour24h: '24 saat',
            allDay: 'Tüm gün',
            hiddenEvents: (count) => `+${count} etkinlik`,
            resourcesLabel: 'Kaynaklar',
            showEventsLabel: (name) => `${name} etkinliklerini göster`,
            hideEventsLabel: (name) => `${name} etkinliklerini gizle`,
            title: 'Başlık',
            saveChanges: 'Kaydet',
            deleteEvent: 'Sil',
            cancel: 'İptal',
            confirm: 'Onayla',
            startDateLabel: 'Başlangıç tarihi',
            endDateLabel: 'Bitiş tarihi',
            startTimeLabel: 'Başlangıç saati',
            endTimeLabel: 'Bitiş saati',
            descriptionLabel: 'Açıklama',
            colorPickerLabel: 'Renk',
            closeButtonLabel: 'Kapat',
            closeButtonAriaLabel: 'Kapat',
            eventTitleAriaLabel: 'Etkinlik başlığı',
            resourceLabel: 'Kaynak',
            labelNoResource: 'Kaynak yok',
            labelInvalidResource: 'Geçersiz kaynak',
            generalTabLabel: 'Genel',
            recurrenceTabLabel: 'Tekrar',
            recurrenceLabel: 'Tekrar',
            recurrenceNoRepeat: 'Tekrar yok',
            recurrenceDailyPresetLabel: 'Günlük',
            recurrenceDailyFrequencyLabel: 'Her',
            recurrenceWeeklyPresetLabel: () => 'Haftalık',
            recurrenceWeeklyFrequencyLabel: 'Her',
            recurrenceMonthlyPresetLabel: () => 'Aylık',
            recurrenceMonthlyFrequencyLabel: 'Her',
            recurrenceYearlyPresetLabel: () => 'Yıllık',
            recurrenceYearlyFrequencyLabel: 'Her',
            recurrenceEndsLabel: 'Bitiş',
            recurrenceEndsNeverLabel: 'Asla',
            recurrenceEndsUntilLabel: 'Tarihine kadar',
            recurrenceEndsAfterLabel: 'Sonra',
            recurrenceEndsTimesLabel: 'kez',
            recurrenceEveryLabel: 'her',
            recurrenceRepeatLabel: 'Tekrarla',
            recurrenceMainSelectCustomLabel: 'Özel',
            recurrenceCustomRepeat: 'Özel tekrar',
            recurrenceMonthlyDayOfMonthLabel: (day) => `${day}. gün`,
            recurrenceMonthlyLastWeekAriaLabel: (day) => `Son ${day}`,
            recurrenceMonthlyLastWeekLabel: (day) => `Son ${day}`,
            recurrenceMonthlyWeekNumberAriaLabel: (ord, day) => `${ord}. ${day}`,
            recurrenceMonthlyWeekNumberLabel: (ord, day) => `${ord}. ${day}`,
            recurrenceWeeklyMonthlySpecificInputsLabel: 'Belirli günler',
            dateTimeSectionLabel: 'Tarih ve Saat',
            resourceColorSectionLabel: 'Kaynak rengi',
            allDayLabel: 'Tüm gün',
            noResourceAriaLabel: 'Kaynak yok',
            resourcesLegendSectionLabel: 'Kaynaklar',
            radioGroupAriaLabel: 'Seçenekler',
            onlyThis: 'Sadece bu',
            thisAndFollowing: 'Bu ve sonrakiler',
            startDateAfterEndDateError: 'Başlangıç tarihi bitiş tarihinden sonra olamaz',
          }}
          sx={{ height: '100%' }}
        />
      </Paper>

      {/* Dialog for Create / View / Edit */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedEvent ? selectedEvent.topic : (role === 'lawyer' ? 'Yeni Randevu Oluştur' : 'Yeni Randevu Talebi')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {selectedEvent ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip label={statusConfig[selectedEvent.status]?.label || selectedEvent.status} color={statusConfig[selectedEvent.status]?.color || 'default'} />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                <strong>Tarih:</strong> {new Date(selectedEvent.appointment_date).toLocaleString('tr-TR')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                <strong>Süre:</strong> {selectedEvent.duration_minutes} dakika
              </Typography>
              {selectedEvent.notes && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  <strong>Notlar:</strong> {selectedEvent.notes}
                </Typography>
              )}
              {role === 'lawyer' && selectedEvent.status === 'REQUESTED' && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button size="small" variant="contained" color="success" onClick={() => handleStatus(selectedEvent.id, 'CONFIRMED')}>Onayla</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleStatus(selectedEvent.id, 'CANCELLED')}>Reddet</Button>
                </Box>
              )}
            </>
          ) : (
            <>
              {role === 'client' && (
                <TextField select label="Avukat" fullWidth value={newAppt.lawyer_id} onChange={(e) => setNewAppt({ ...newAppt, lawyer_id: e.target.value })}
                  slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}>
                  <option value="">Seçiniz</option>
                  {lawyers.map((l) => (
                    <option key={l.id} value={l.id}>{l.full_name}{l.specialization ? ` - ${l.specialization}` : ''}</option>
                  ))}
                </TextField>
              )}
              {role === 'lawyer' && (
                <TextField select label="Müvekkil" fullWidth value={newAppt.client_id} onChange={(e) => setNewAppt({ ...newAppt, client_id: e.target.value })}
                  slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}>
                  <option value="">Seçiniz</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </TextField>
              )}
              <TextField label="Konu" fullWidth value={newAppt.topic} onChange={(e) => setNewAppt({ ...newAppt, topic: e.target.value })} />
              {selectedSlot && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  <strong>Seçili Tarih:</strong> {selectedSlot.start.toLocaleString('tr-TR')}
                </Typography>
              )}
              <TextField label="Süre (dk)" type="number" fullWidth value={newAppt.duration_minutes} onChange={(e) => setNewAppt({ ...newAppt, duration_minutes: parseInt(e.target.value) || 60 })} />
              <TextField label="Notlar" fullWidth multiline rows={2} value={newAppt.notes} onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Kapat</Button>
          {!selectedEvent && (
            <Button variant="contained" onClick={handleCreate} disabled={loading || (role === 'client' ? !newAppt.lawyer_id : !newAppt.client_id) || !newAppt.topic}>
              {role === 'lawyer' ? 'Oluştur' : 'Talep Gönder'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((t) => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
