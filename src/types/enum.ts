export enum DiscountType {
  Amount = "amount",
  Percentage = "percentage",
}

export enum CustomerSource {
  Facebook = "facebook",
  Zalo = "zalo",
  Instagram = "instagram",
  Tiktok = "tiktok",
  Website = "website",
  Referral = "referral",
  WalkIn = "walk_in",
  Phone = "phone",
  Other = "other",
}

export const CustomerSourceOptions = [
  { label: "Facebook", value: CustomerSource.Facebook },
  { label: "Zalo", value: CustomerSource.Zalo },
  { label: "Instagram", value: CustomerSource.Instagram },
  { label: "TikTok", value: CustomerSource.Tiktok },
  { label: "Website", value: CustomerSource.Website },
  { label: "Giới thiệu", value: CustomerSource.Referral },
  { label: "Đến trực tiếp", value: CustomerSource.WalkIn },
  { label: "Điện thoại", value: CustomerSource.Phone },
  { label: "Khác", value: CustomerSource.Other },
];

export enum ROLES {
  sales = "sales",
  // Marketing = "marketing",
  development = "development",
  // HR = "hr",
  admin = "admin",
  // Accountant = "accountant",
  worker = "worker",
}

export const RolesOptions = [
  { label: "Bán hàng", value: ROLES.sales },
  // { label: "Tiếp thị", value: ROLES.Marketing },
  { label: "Dev", value: ROLES.development },
  // { label: "Nhân sự", value: ROLES.HR },
  { label: "Quản trị", value: ROLES.admin },
  // { label: "Kế toán", value: ROLES.Accountant },
  { label: "Công nhân", value: ROLES.worker },
]

export const RoleLabels: Record<ROLES, string> = {
  admin: "Quản trị",
  // accountant: "Kế toán",
  sales: "NV bán hàng",
  worker: "Công nhân",
  // marketing: "Tiếp thị",
  development: "Dev",
  // hr: "Nhân sự",
};

export type IOption ={
    label: string;
    value: string;
}
