import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { DoctorForm } from '../components/forms/doctor-form';
import { fetchDoctors } from '../lib/doctors';
import { queryKeys } from '../lib/query-keys';
import './posts-page.css';

export function DoctorsCreatePage() {
  const doctorsQuery = useQuery({
    queryKey: queryKeys.doctors,
    queryFn: fetchDoctors
  });

  const nextSortOrder = useMemo(() => {
    const doctors = doctorsQuery.data ?? [];
    if (doctors.length === 0) {
      return 1;
    }

    const maxSortOrder = Math.max(
      ...doctors.map((doctor, index) =>
        typeof doctor.sort_order === 'number' ? doctor.sort_order : index + 1
      )
    );

    return maxSortOrder + 1;
  }, [doctorsQuery.data]);

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>ახალი ექიმის დამატება</h1>
          <p className="hint">შეავსეთ ექიმის ინფორმაცია და შეინახეთ. რიგითობა დაემატება ავტომატურად.</p>
        </div>

        <Link to="/doctors/list" className="button-secondary">ექიმების სია</Link>
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
