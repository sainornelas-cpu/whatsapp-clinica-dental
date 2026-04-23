'use client';

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';

interface Patient {
  id: string;
  phone_number: string;
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  allergies: string | null;
  notes: string | null;
  created_at: string;
}

interface Appointment {
  id: string;
  service_type: string;
  appointment_date: string;
  status: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponent();

  useEffect(() => {
    loadPatients();
  }, [supabase]);

  const loadPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientAppointments = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading patient appointments:', error);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    loadPatientAppointments(patient.id);
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone_number.includes(searchTerm) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Cargando pacientes...</div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-4rem)]">
      {/* Patients List */}
      <div className="w-80 bg-gray-800 rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-3">Pacientes</h2>
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p className="text-sm text-gray-400 mt-2">{filteredPatients.length} pacientes</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No se encontraron pacientes
            </div>
          ) : (
            filteredPatients.map((patient) => (
              <button
                key={patient.id}
                onClick={() => selectPatient(patient)}
                className={`w-full p-4 text-left border-b border-gray-700 hover:bg-gray-700 transition-colors ${
                  selectedPatient?.id === patient.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {patient.full_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {patient.full_name || 'Sin nombre'}
                    </p>
                    <p className="text-sm text-gray-400 truncate">{patient.phone_number}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Patient Details */}
      <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden flex flex-col">
        {selectedPatient ? (
          <>
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedPatient.full_name?.[0] || '?'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedPatient.full_name || 'Sin nombre'}</h2>
                  <p className="text-gray-400">{selectedPatient.phone_number}</p>
                  {selectedPatient.email && (
                    <p className="text-sm text-gray-500">{selectedPatient.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-gray-750 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Información personal</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-400">Fecha de nacimiento</p>
                    <p className="text-white">
                      {selectedPatient.date_of_birth ? formatDate(selectedPatient.date_of_birth) : 'No registrada'}
                    </p>
                  </div>
                  {selectedPatient.allergies && (
                    <div>
                      <p className="text-sm text-gray-400">Alergias</p>
                      <p className="text-white">{selectedPatient.allergies}</p>
                    </div>
                  )}
                  {selectedPatient.notes && (
                    <div>
                      <p className="text-sm text-gray-400">Notas</p>
                      <p className="text-white">{selectedPatient.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-750 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Historial de citas</h3>
                {appointments.length === 0 ? (
                  <p className="text-gray-500">No hay citas registradas</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="bg-gray-800 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">{appointment.service_type}</p>
                            <p className="text-sm text-gray-400">{formatDateTime(appointment.appointment_date)}</p>
                          </div>
                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                            {appointment.status === 'scheduled' ? 'Programada' : appointment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Selecciona un paciente para ver su información
          </div>
        )}
      </div>
    </div>
  );
}