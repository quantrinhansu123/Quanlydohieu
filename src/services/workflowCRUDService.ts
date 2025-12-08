import { ROLES } from '@/types/enum';
import { get, getDatabase, onValue, ref, remove, set, update } from 'firebase/database';

const db = getDatabase();
const WORKFLOWS_PATH = 'xoxo/workflows';

export interface IWorkflow {
  code: string;
  name: string;
  department: ROLES;
  createdAt?: number;
  updatedAt?: number;
}

export class WorkflowCRUDService {
  static async getAll(): Promise<IWorkflow[]> {
    const snapshot = await get(ref(db, WORKFLOWS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([code, workflow]) => ({
      code,
      ...(workflow as Omit<IWorkflow, 'code'>)
    }));
  }

  static async getById(code: string): Promise<IWorkflow | null> {
    const snapshot = await get(ref(db, `${WORKFLOWS_PATH}/${code}`));
    const data = snapshot.val();
    return data ? { code, ...data } : null;
  }

  static async create(workflow: Omit<IWorkflow, 'createdAt' | 'updatedAt'>): Promise<IWorkflow> {
    const now = new Date().getTime();
    const workflowData = {
      ...workflow,
      createdAt: now,
      updatedAt: now,
    };
    await set(ref(db, `${WORKFLOWS_PATH}/${workflow.code}`), workflowData);
    return workflowData;
  }

  static async update(code: string, workflow: Partial<Omit<IWorkflow, 'code' | 'createdAt'>>): Promise<void> {
    const workflowData = {
      ...workflow,
      updatedAt: new Date().getTime(),
    };
    await update(ref(db, `${WORKFLOWS_PATH}/${code}`), workflowData);
  }

  static async delete(code: string): Promise<void> {
    await remove(ref(db, `${WORKFLOWS_PATH}/${code}`));
  }

  static onSnapshot(callback: (workflows: IWorkflow[]) => void): () => void {
    const workflowsRef = ref(db, WORKFLOWS_PATH);
    const unsubscribe = onValue(workflowsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const workflows = Object.entries(data).map(([code, workflow]) => ({
        code,
        ...(workflow as Omit<IWorkflow, 'code'>)
      }));
      callback(workflows);
    });

    return unsubscribe;
  }
}
