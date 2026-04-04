import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ButtonLink } from '../../components/ui/button';
import { DoctorForm } from '../../components/forms/doctor-form';
import { fetchDoctors } from '../../lib/doctors';
import { queryKeys } from '../../lib/query-keys';
import '../shared/content-page.scss';

export function DoctorsCreatePage() {
  const doctorsQuery = useQuery({
    queryKey: queryKeys.doctors,
    queryFn: fetchDoctors,
  });

  const nextSortOrder = useMemo(() => {
    const doctors = doctorsQuery.data ?? [];
    if (doctors.length === 0) {
      return 1;
    }

    const maxSortOrder = Math.max(
      ...doctors.map((doctor, index) =>
        typeof doctor.sort_order === 'number' ? doctor.sort_order : index + 1,
      ),
    );

    return maxSortOrder + 1;
  }, [doctorsQuery.data]);

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>ახალი ექიმის დამატება</h1>
          <p className="hint">
            შეავსეთ ექიმის ინფორმაცია და შეინახეთ. რიგითობა დაემატება ავტომატურად.
          </p>
        </div>

        <ButtonLink to="/doctors/list" variant="secondary">
          ექიმების სია
        </ButtonLink>
      </div>

      <DoctorForm
        defaultSortOrder={nextSortOrder}
        onSaved={() => {
          void doctorsQuery.refetch();
        }}
      />
    </div>
  );
}
