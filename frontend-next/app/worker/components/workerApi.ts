import { api } from '@/lib/api';
import type {
  WorkerCalculateForm,
  WorkerCalculateResponse,
  WorkerContractRequest,
} from './workerTypes';

export async function calculateWorkerGuide(
    form: WorkerCalculateForm
): Promise<WorkerCalculateResponse> {
  const response = await api.post('/api/v1/worker/calculate', {
    employeeCount: Number(form.workerCount),
    dailyWorkHours: Number(form.dailyWorkHours),
    weeklyWorkDays: Number(form.weeklyWorkDays),
    hourlyWage: Number(form.hourlyWage),
    employeeType: form.workerType,
  });

  return response.json();
}

export async function createWorkerContractPdf(payload: WorkerContractRequest): Promise<Blob> {
  const response = await api.post('/api/v1/worker/contract/pdf', payload);

  return response.blob();
}
