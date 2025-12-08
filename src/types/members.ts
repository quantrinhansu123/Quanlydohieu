import { ROLES } from "@/types/enum";

export interface IMembers {
  code: string;
  id: string;
  name: string;
  phone: string;
  email: string;
  role: ROLES;
  departments?: string[]; // Array of department codes (only for worker role)
  date_of_birth: string;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

