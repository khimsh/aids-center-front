import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DoctorForm } from '../../components/forms/doctor-form';
import '../shared/content-page.scss';

export function DoctorsEditPage() {
  const navigate = useNavigate();
  const params = useParams();

  const doctorId = useMemo(() => {
    const parsed = Number(params.doctorId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [params.doctorId]);

  if (doctorId == null) {
    return (
      <div className="posts-page">
        <h1>ექიმის რედაქტირება</h1>
        <p className="error">არასწორი ექიმის ID.</p>
      </div>
    );
  }

  return (
    <div className="posts-page">
      <div className="posts-header">
        <div>
          <h1>ექიმის რედაქტირება</h1>
          <p className="hint">განაახლეთ ექიმის ინფორმაცია და შეინახეთ ცვლილებები.</p>
        </div>
      </div>

      <DoctorForm doctorId={doctorId} onSaved={() => navigate('/doctors/list')} />
    </div>
  );
}
