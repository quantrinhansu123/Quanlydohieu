import { get, getDatabase, onValue, ref, remove, set, update } from 'firebase/database';

const db = getDatabase();
const DEPARTMENTS_PATH = 'xoxo/departments';

export interface IDepartment {
  code: string;
  name: string;
  createdAt?: number;
  updatedAt?: number;
}

export class DepartmentService {
  static async getAll(): Promise<IDepartment[]> {
    const snapshot = await get(ref(db, DEPARTMENTS_PATH));
    const data = snapshot.val() || {};
    return Object.entries(data).map(([code, department]) => ({
      code,
      ...(department as Omit<IDepartment, 'code'>)
    }));
  }

  static async getById(code: string): Promise<IDepartment | null> {
    const snapshot = await get(ref(db, `${DEPARTMENTS_PATH}/${code}`));
    const data = snapshot.val();
    return data ? { code, ...data } : null;
  }

  static async create(department: Omit<IDepartment, 'createdAt' | 'updatedAt'>): Promise<IDepartment> {
    const now = new Date().getTime();
    const departmentData = {
      ...department,
      createdAt: now,
      updatedAt: now,
    };
    await set(ref(db, `${DEPARTMENTS_PATH}/${department.code}`), departmentData);
    return departmentData;
  }

  static async update(code: string, department: Partial<Omit<IDepartment, 'code' | 'createdAt'>>): Promise<void> {
    const departmentData = {
      ...department,
      updatedAt: new Date().getTime(),
    };
    await update(ref(db, `${DEPARTMENTS_PATH}/${code}`), departmentData);
  }

  static async delete(code: string): Promise<void> {
    await remove(ref(db, `${DEPARTMENTS_PATH}/${code}`));
  }

  static onSnapshot(callback: (departments: IDepartment[]) => void): () => void {
    const departmentsRef = ref(db, DEPARTMENTS_PATH);
    const unsubscribe = onValue(departmentsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const departments = Object.entries(data).map(([code, department]) => ({
        code,
        ...(department as Omit<IDepartment, 'code'>)
      }));
      callback(departments);
    });

    return unsubscribe;
  }
}

