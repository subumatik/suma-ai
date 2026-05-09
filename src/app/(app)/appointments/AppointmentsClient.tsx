'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { EventCalendar, eventCalendarClasses } from '@mui/x-scheduler';
import { tr } from 'date-fns/locale';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Typography, Chip, Snackbar, Alert, Paper, Stack,
  Card, CardContent, ToggleButton, ToggleButtonGroup,
  IconButton, Divider, useMediaQuery, useTheme,
} from '@mui/material';
import { Add, Gavel, Schedule as ScheduleIcon, ChevronLeft, ChevronRight, ViewList, CalendarMonth } from '@mui/icons-material';

interface AppointmentsClientProps {
  appointments: any[];
  role: string;
  userId: string;
  lawyers: any[];
  clients: any[];
  hearings: any[];
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

export default function AppointmentsClient({ appointments, role, userId, lawyers, clients, hearings }: AppointmentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const urlLawyerId = searchParams.get('lawyer') ?? '';
  const initialLawyerId = lawyers.find((l) => l.id === urlLawyerId) ? urlLawyerId : (lawyers[0]?.id ?? '');

  const [events, setEvents] = useState<any[]>([]);
  const [mobileView, setMobileView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    const safeDate = (val: any) => {
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    };
    setEvents([
      ...appointments.filter((a) => a.appointment_date).map((a) => ({
        id: a.id,
        title: a.topic || 'Randevu',
        start: safeDate(a.appointment_date),
        end: safeDate(new Date(new Date(a.appointment_date).getTime() + (a.duration_minutes || 60) * 60000)),
        color: statusColorMap[a.status] || 'teal',
        description: a.notes || '',
        type: 'appointment' as const,
      })),
      ...hearings.filter((h) => h.hearing_date).map((h) => ({
        id: `hearing-${h.id}`,
        title: `Duruşma: ${h.dosya?.title || 'Dosya'}`,
        start: safeDate(h.hearing_date),
        end: safeDate(new Date(new Date(h.hearing_date).getTime() + 60 * 60000)),
        color: 'purple',
        description: [h.court_name, h.description].filter(Boolean).join(' - '),
        type: 'hearing' as const,
        hearing: h,
      })),
    ]);
  }, [appointments, hearings]);

  const [visibleDate, setVisibleDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month' | 'agenda'>(isMobile ? 'day' : 'week');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [newAppt, setNewAppt] = useState({
    lawyer_id: role === 'lawyer' ? userId : initialLawyerId,
    client_id: '',
    topic: '',
    notes: '',
    duration_minutes: 60,
    appointment_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToast({ open: true, message, severity });
  };

  const handleCreateFromSlot = useCallback((start: Date, end: Date) => {
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setNewAppt({
      lawyer_id: role === 'lawyer' ? userId : initialLawyerId,
      client_id: '',
      topic: '',
      notes: '',
      duration_minutes: Math.round((end.getTime() - start.getTime()) / 60000),
      appointment_date: start.toISOString().slice(0, 16),
    });
    setOpenDialog(true);
  }, [role, userId, initialLawyerId]);

  const openCreateDialog = () => {
    setSelectedSlot(null);
    setSelectedEvent(null);
    setNewAppt({
      lawyer_id: role === 'lawyer' ? userId : initialLawyerId,
      client_id: '',
      topic: '',
      notes: '',
      duration_minutes: 60,
      appointment_date: '',
    });
    setOpenDialog(true);
  };

  const handleEventClick = useCallback((event: any) => {
    if (event.type === 'hearing') {
      setSelectedEvent(event.hearing);
      setSelectedSlot(null);
      setOpenDialog(true);
      return;
    }
    const appt = appointments.find((a) => a.id === event.id);
    if (appt) {
      setSelectedEvent(appt);
      setSelectedSlot(null);
      setOpenDialog(true);
    }
  }, [appointments]);

  const handleCalendarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

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

  const handleEventsChange = useCallback((value: any[]) => {
    const oldIds = new Set(events.map((e) => e.id));
    const newEvent = value.find((e) => !oldIds.has(e.id));
    if (newEvent) {
      const start = new Date(newEvent.start);
      const end = new Date(newEvent.end);
      handleCreateFromSlot(start, end);
      setEvents((prev) => prev.filter((e) => e.id !== newEvent.id));
      return;
    }

    const updatedEvent = value.find((v) => {
      const old = events.find((e) => e.id === v.id);
      return old && old.type !== 'hearing' && (old.start !== v.start || old.end !== v.end);
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
      // Find a shared dosya to link the appointment
      let dosya_id: string | null = null;
      const { data: lawyerDosyalar } = await supabase
        .from('dosya_lawyers')
        .select('dosya_id')
        .eq('lawyer_id', targetLawyerId);
      const lawyerDosyaIds = (lawyerDosyalar ?? []).map((d) => d.dosya_id);
      if (lawyerDosyaIds.length > 0) {
        const { data: sharedDosya } = await supabase
          .from('dosya_clients')
          .select('dosya_id')
          .eq('client_id', targetClientId)
          .in('dosya_id', lawyerDosyaIds)
          .limit(1)
          .maybeSingle();
        dosya_id = sharedDosya?.dosya_id ?? null;
      }

      const appointmentDate = newAppt.appointment_date
        ? new Date(newAppt.appointment_date).toISOString()
        : (selectedSlot ? selectedSlot.start.toISOString() : new Date().toISOString());
      const res = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyer_id: targetLawyerId,
          client_id: targetClientId,
          dosya_id,
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
          type: 'appointment' as const,
        },
      ]);
      setNewAppt({ lawyer_id: role === 'lawyer' ? userId : '', client_id: '', topic: '', notes: '', duration_minutes: 60, appointment_date: '' });
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

  // Build sorted upcoming/past list
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events]);

  const now = useMemo(() => new Date(), []);
  const upcoming = sortedEvents.filter((e) => new Date(e.start).getTime() >= now.getTime());
  const past = sortedEvents.filter((e) => new Date(e.start).getTime() < now.getTime());

  const renderEventCard = (e: any) => {
    const isHearing = e.type === 'hearing';
    const status = appointments.find((a) => a.id === e.id)?.status;
    const cfg = status ? statusConfig[status] : undefined;
    return (
      <Card
        key={e.id}
        sx={{
          cursor: 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
          borderLeft: '4px solid',
          borderColor: isHearing ? 'secondary.main' : (status === 'CONFIRMED' ? 'success.main' : status === 'REQUESTED' ? 'warning.main' : status === 'CANCELLED' ? 'error.main' : 'info.main'),
          '&:hover': { transform: 'translateY(-1px)', boxShadow: 3 },
        }}
        onClick={() => handleEventClick(e)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, gap: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, wordBreak: 'break-word', minWidth: 0, flex: 1 }}>
              {e.title}
            </Typography>
            {isHearing ? (
              <Chip size="small" label="Duruşma" color="secondary" />
            ) : (
              cfg && <Chip size="small" label={cfg.label} color={cfg.color} />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
            <ScheduleIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {new Date(e.start).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}
            </Typography>
          </Box>
          {e.description && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', wordBreak: 'break-word' }}>
              {e.description}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderListView = () => (
    <Stack spacing={3}>
      {/* Mini month-day picker */}
      <Card sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
          <IconButton size="small" onClick={() => setVisibleDate((d) => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {visibleDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
          </Typography>
          <IconButton size="small" onClick={() => setVisibleDate((d) => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}>
            <ChevronRight />
          </IconButton>
        </Box>
      </Card>

      {upcoming.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
            Yaklaşan ({upcoming.length})
          </Typography>
          <Stack spacing={1.5}>
            {upcoming.map(renderEventCard)}
          </Stack>
        </Box>
      )}

      {past.length > 0 && (
        <Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary' }}>
            Geçmiş ({past.length})
          </Typography>
          <Stack spacing={1.5}>
            {past.slice(-10).reverse().map(renderEventCard)}
          </Stack>
        </Box>
      )}

      {events.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>Randevu / duruşma bulunmuyor</Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {role === 'lawyer' ? 'İlk randevunu oluştur.' : 'Avukatın ile randevu talep edebilirsin.'}
          </Typography>
        </Box>
      )}
    </Stack>
  );

  return (
    <Box sx={{ minHeight: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '1.5rem', md: '2rem' } }}>Randevular</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            size="small"
            value={mobileView}
            exclusive
            onChange={(_, v) => v && setMobileView(v)}
            aria-label="görünüm"
          >
            <ToggleButton value="list" aria-label="liste">
              <ViewList sx={{ mr: 0.5 }} fontSize="small" />
              Liste
            </ToggleButton>
            <ToggleButton value="calendar" aria-label="takvim">
              <CalendarMonth sx={{ mr: 0.5 }} fontSize="small" />
              Takvim
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
            fullWidth={isMobile}
            sx={{ flex: { xs: '1 0 100%', md: '0 0 auto' }, mt: { xs: 1, md: 0 } }}
          >
            {role === 'lawyer' ? 'Randevu Oluştur' : 'Randevu Al'}
          </Button>
        </Box>
      </Box>

      {(isMobile && mobileView === 'list') || (!isMobile && mobileView === 'list') ? (
        renderListView()
      ) : (
        <Paper sx={{ flex: 1, borderRadius: 3, overflow: 'auto', minHeight: 500 }}>
          <EventCalendar
            events={events}
            onEventsChange={handleEventsChange}
            eventCreation={false}
            areEventsDraggable={role === 'lawyer'}
            areEventsResizable={role === 'lawyer'}

            views={['day', 'week', 'month', 'agenda']}
            dateLocale={tr}
            view={view}
            onViewChange={(newView) => setView(newView)}
            visibleDate={visibleDate}
            onVisibleDateChange={(date) => setVisibleDate(new Date(date))}
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
            sx={{ height: '100%', minHeight: 500 }}
          />
        </Paper>
      )}

      {/* Dialog for Create / View / Edit */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {selectedEvent
            ? (selectedEvent.hearing_date ? 'Duruşma Detayı' : (selectedEvent.topic || 'Randevu Detayı'))
            : (role === 'lawyer' ? 'Yeni Randevu Oluştur' : 'Yeni Randevu Talebi')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, overflow: 'auto' }}>
          {selectedEvent ? (
            selectedEvent.hearing_date ? (
              <>
                <Chip label="Duruşma" color="secondary" sx={{ alignSelf: 'flex-start' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  <strong>Tarih:</strong> {new Date(selectedEvent.hearing_date).toLocaleString('tr-TR')}
                </Typography>
                {selectedEvent.court_name && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    <strong>Mahkeme:</strong> {selectedEvent.court_name}
                  </Typography>
                )}
                {selectedEvent.description && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>
                    <strong>Açıklama:</strong> {selectedEvent.description}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  <strong>Dosya:</strong> {selectedEvent.dosya?.title || '-'}
                </Typography>
              </>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Chip label={statusConfig[selectedEvent.status]?.label || selectedEvent.status} color={statusConfig[selectedEvent.status]?.color || 'default'} />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  <strong>Tarih:</strong> {new Date(selectedEvent.appointment_date).toLocaleString('tr-TR')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  <strong>Süre:</strong> {selectedEvent.duration_minutes} dakika
                </Typography>
                {selectedEvent.notes && (
                  <Typography variant="body2" sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>
                    <strong>Notlar:</strong> {selectedEvent.notes}
                  </Typography>
                )}
                {role === 'lawyer' && selectedEvent.status === 'REQUESTED' && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                    <Button fullWidth variant="contained" color="success" onClick={() => handleStatus(selectedEvent.id, 'CONFIRMED')}>Onayla</Button>
                    <Button fullWidth variant="outlined" color="error" onClick={() => handleStatus(selectedEvent.id, 'CANCELLED')}>Reddet</Button>
                  </Stack>
                )}
              </>
            )
          ) : (
            <>
              {role === 'client' && (
                lawyers.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Randevu alabilmek için önce bir avukatla bağlantı kurmalısınız.
                  </Typography>
                ) : (
                  <TextField select label="Avukat" fullWidth value={newAppt.lawyer_id} onChange={(e) => setNewAppt({ ...newAppt, lawyer_id: e.target.value })}
                    slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}>
                    <option value="">Seçiniz</option>
                    {lawyers.map((l) => (
                      <option key={l.id} value={l.id}>{l.full_name}{l.specialization ? ` - ${l.specialization}` : ''}</option>
                    ))}
                  </TextField>
                )
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
              <TextField
                label="Tarih ve Saat"
                type="datetime-local"
                fullWidth
                value={newAppt.appointment_date}
                onChange={(e) => setNewAppt({ ...newAppt, appointment_date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField label="Süre (dk)" type="number" fullWidth value={newAppt.duration_minutes} onChange={(e) => setNewAppt({ ...newAppt, duration_minutes: parseInt(e.target.value) || 60 })} />
              <TextField label="Notlar" fullWidth multiline rows={3} value={newAppt.notes} onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })} />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 }, '& > button': { width: { xs: '100%', sm: 'auto' } } }}>
          <Button onClick={() => setOpenDialog(false)}>Kapat</Button>
          {!selectedEvent && (
            <Button variant="contained" onClick={handleCreate} disabled={loading || (role === 'client' ? !newAppt.lawyer_id : !newAppt.client_id) || !newAppt.topic || !newAppt.appointment_date}>
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
