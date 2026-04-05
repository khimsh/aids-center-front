import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bars3Icon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { ConfirmModal } from '../../components/ui/confirm-modal';
import { Button, ButtonLink } from '../../components/ui/button';
import {
  deleteDoctor,
  fetchDoctors,
  reorderDoctorsByIds,
  type DoctorRecord,
} from '../../lib/doctors';
import { queryKeys } from '../../lib/query-keys';
import '../shared/content-page.scss';
import { useMemo, useState } from 'react';

function getDisplayTime(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

export function DoctorsListPage() {
  const queryClient = useQueryClient();
  const [doctorToDelete, setDoctorToDelete] = useState<DoctorRecord | null>(null);
  const [busyDoctorId, setBusyDoctorId] = useState<number | null>(null);
  const [draggedDoctorId, setDraggedDoctorId] = useState<number | null>(null);
  const [dragOverDoctorId, setDragOverDoctorId] = useState<number | null>(null);

  const doctorsQuery = useQuery({
    queryKey: queryKeys.doctors,
    queryFn: fetchDoctors,
  });

  const doctors = useMemo(
    () => [...(doctorsQuery.data ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [doctorsQuery.data],
  );

  const refreshDoctors = async () => {
    try {
      await doctorsQuery.refetch();
    } catch {
      toast.error('ექიმების განახლება ვერ მოხერხდა.');
    }
  };

  const reorderByDrop = async (sourceId: number, targetId: number) => {
    if (sourceId === targetId) {
      return;
    }

    const sourceIndex = doctors.findIndex((doctor) => doctor.id === sourceId);
    const targetIndex = doctors.findIndex((doctor) => doctor.id === targetId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const orderedIds = doctors.map((doctor) => doctor.id);
    const [moved] = orderedIds.splice(sourceIndex, 1);
    orderedIds.splice(targetIndex, 0, moved);

    setBusyDoctorId(sourceId);

    try {
      await reorderDoctorsByIds(orderedIds);
      await queryClient.invalidateQueries({ queryKey: queryKeys.doctors });
      toast.success('რიგითობა განახლდა.');
    } catch {
      toast.error('რიგითობის განახლება ვერ მოხერხდა.');
    } finally {
      setBusyDoctorId(null);
      setDraggedDoctorId(null);
      setDragOverDoctorId(null);
    }
  };

  const removeDoctor = async (doctorId: number) => {
    setBusyDoctorId(doctorId);

    try {
      await deleteDoctor(doctorId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.doctors });
      toast.success('ექიმი წაიშალა.');
    } catch {
      toast.error('ექიმის წაშლა ვერ მოხერხდა.');
    } finally {
      setBusyDoctorId(null);
      setDoctorToDelete(null);
    }
  };

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>ექიმები</h1>
          <p className="hint">ექიმების სია, რედაქტირება და რიგითობის მართვა.</p>
        </div>

        <div className="posts-actions">
          <ButtonLink to="/doctors/new" variant="secondary">
            ახალი ექიმის დამატება
          </ButtonLink>
          <Button type="button" variant="secondary" onClick={() => void refreshDoctors()}>
            განახლება
          </Button>
        </div>
      </div>

      {doctorsQuery.isLoading ? <p className="hint">იტვირთება...</p> : null}
      {doctorsQuery.isError ? <p className="error">ექიმების ჩატვირთვა ვერ მოხერხდა.</p> : null}

      {doctors.length === 0 ? (
        <p className="hint">ექიმები ჯერ არ არის დამატებული.</p>
      ) : (
        <div className="posts-list">
          <p className="hint">გადაათრიეთ ექიმის ბარათი რიგითობის შესაცვლელად.</p>
          <div className="doctors-list">
            {doctors.map((doctor, index) => {
              const isBusy = busyDoctorId === doctor.id;
              const isDragged = draggedDoctorId === doctor.id;
              const isDragOver = dragOverDoctorId === doctor.id;

              return (
                <article
                  className={`post-card doctor-card ${isDragOver ? 'doctor-card--drag-over' : ''}`.trim()}
                  key={doctor.id}
                  draggable={!isBusy}
                  onDragStart={() => setDraggedDoctorId(doctor.id)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggedDoctorId !== doctor.id) {
                      setDragOverDoctorId(doctor.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverDoctorId === doctor.id) {
                      setDragOverDoctorId(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedDoctorId != null) {
                      void reorderByDrop(draggedDoctorId, doctor.id);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedDoctorId(null);
                    setDragOverDoctorId(null);
                  }}
                  style={{
                    opacity: isDragged ? 0.6 : 1,
                    cursor: isBusy ? 'default' : 'grab',
                  }}
                >
                  <div className="drag-indicator" aria-hidden="true">
                    <Bars3Icon style={{ width: 14, height: 14 }} />
                    <span>drag</span>
                  </div>

                  <div className="post-meta">
                    <span>#{doctor.sort_order ?? index + 1}</span>
                  </div>

                  <h3>{doctor.name}</h3>
                  <p>
                    {doctor.specialty ?? doctor.department ?? 'სპეციალიზაცია მითითებული არ არის'}
                  </p>

                  <div className="post-actions">
                    <ButtonLink
                      to={`/doctors/${doctor.id}/edit`}
                      variant="with-icon"
                      aria-disabled={isBusy}
                    >
                      <PencilSquareIcon aria-hidden="true" style={{ width: 16, height: 16 }} />
                      <span>რედაქტირება</span>
                    </ButtonLink>

                    <Button
                      type="button"
                      variant="with-icon"
                      disabled={isBusy}
                      onClick={() => setDoctorToDelete(doctor)}
                    >
                      <TrashIcon aria-hidden="true" style={{ width: 16, height: 16 }} />
                      <span>წაშლა</span>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(doctorToDelete)}
        title="ექიმის წაშლა"
        message={`ნამდვილად გსურთ ექიმის წაშლა: ${doctorToDelete?.name ?? ''}?`}
        confirmLabel="წაშლა"
        cancelLabel="გაუქმება"
        busy={Boolean(doctorToDelete && busyDoctorId === doctorToDelete.id)}
        onConfirm={() => {
          if (!doctorToDelete) {
            return;
          }

          void removeDoctor(doctorToDelete.id);
        }}
        onCancel={() => setDoctorToDelete(null)}
      />
    </div>
  );
}
