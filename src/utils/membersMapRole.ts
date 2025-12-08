import { IOption, ROLES } from "@/types/enum";
import { IMembers } from "@/types/members";
import { FirebaseStaff } from "@/types/order";

/**
 * Nhóm danh sách nhân viên theo role/department
 * @param members - Danh sách tất cả nhân viên
 * @returns Object với key là role và value là array các nhân viên thuộc role đó
 */
export function groupMembersByRole(members: FirebaseStaff): Record<ROLES | "all", IOption[]> {
     const membersArray = Object.entries(members).map(([id, member]) => ({
    ...member,
    id,
  }));
  // Khởi tạo object với tất cả các department có array rỗng
  const initialMap = Object.values(ROLES).reduce((acc, role) => {
    acc[role] = [];
    return acc;
  }, {
    all:membersArray.map(member => ({
      label: member.name,
      value: member.id,
    })),
  } as Record<ROLES | "all", IOption[]>);


  // Nhóm các member theo role
  return membersArray.reduce((acc, member) => {
    if (member.role && acc[member.role]) {
      acc[member.role].push({
        label: member.name,
        value: member.id,
      });
    }
    return acc;
  }, initialMap);
}
