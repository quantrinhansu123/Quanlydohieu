import {
  DashboardOutlined,
  DollarOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";

export const allMenuItems: Array<{
  title: string;
  Icon: React.ComponentType;
  href?: string;
  permission?: string | null;
  prefix?: string;
  children?: Array<{
    title: string;
    href: string;
    permission?: string;
  }>;
}> = [
  {
    title: "Thống kê",
    href: "/dashboard",
    Icon: DashboardOutlined,
    permission: null,
  },
  {
    title: "Khách hàng",
    prefix: "Quản lý",
    Icon: UserOutlined,
    children: [
      {
        title: "Danh sách khách hàng",
        href: "/customers",
      },
      {
        title: "Quản lý Leads",
        href: "/customers/leads",
      },
      {
        title: "Chăm sóc khách hàng",
        href: "/customers/customer-care",
      },
    ],
  },
  {
    title: "Bán hàng",
    prefix: "Quản lý",
    Icon: ShoppingCartOutlined,
    children: [
      {
        title: "Danh sách đơn hàng",
        href: "/sale/orders",
      },
      {
        title: "Kanban dịch vụ",
        href: "/sale/kanban",
      },
    ],
  },
  {
    title: "Vận hành",
    prefix: "Quản lý",
    Icon: ShopOutlined,
    children: [
      {
        title: "Sản xuất",
        href: "/workflow-management",
      },
      {
        title: "Theo dõi hàng hóa",
        href: "/product-tracking",
      },
      {
        title: "Kho",
        href: "/inventory",
      },
    ],
  },
  {
    title: "Tài chính",
    prefix: "Quản lý",
    Icon: DollarOutlined,
    children: [
      {
        title: "Thu Chi",
        href: "/finance",
      },
      {
        title: "Lương & Hoa hồng",
        href: "/_old/payroll",
      },
    ],
  },
  {
    title: "Nhân sự",
    prefix: "Quản lý",
    Icon: TeamOutlined,
    children: [
      {
        title: "Nhân viên",
        href: "/hr/members",
      },
      {
        title: "Tuyển dụng",
        href: "/hr/recruitment",
      },
      {
        title: "Đào tạo",
        href: "/hr/training",
      },
    ],
  },
  {
    title: "Thiết lập",
    prefix: "Thiết lập",
    Icon: SettingOutlined,
    children: [
      {
        title: "Kỹ thuật",
        href: "/technician",
      },
      {
        title: "Quy trình",
        href: "/workflow-config",
      },
    ],
  },
];

function normalizePath(p?: string) {
  if (!p) return "";
  let path = p.trim();
  if (!path.startsWith("/")) path = "/" + path;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

function generateBreadcrumbMap(
  items: typeof allMenuItems
): Record<string, string> {
  const map: Record<string, string> = {};

  items.forEach((item) => {
    if (item.href) {
      map[normalizePath(item.href)] = item.title;
    }

    if (item.children && item.children.length) {
      // derive a base path for the parent menu (e.g. '/inventory') from the first child's href
      const firstChildHref = item.children.find((c) => !!c.href)?.href;
      if (firstChildHref) {
        const segments = normalizePath(firstChildHref).split("/");
        const base = segments[1] ? `/${segments[1]}` : "";
        if (base) map[base] = item.title;
      }

      item.children.forEach((child) => {
        if (child.href) {
          map[normalizePath(child.href)] = item.prefix + " " + child.title;
        }
      });
    }
  });

  return map;
}

export const breadcrumbMap: Record<string, string> = {
  ...generateBreadcrumbMap(allMenuItems),
};
