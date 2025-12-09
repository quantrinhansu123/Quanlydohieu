import {
  BookOutlined,
  CalculatorOutlined,
  ContactsOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  IdcardOutlined,
  InboxOutlined,
  LayoutOutlined,
  MoneyCollectOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ToolOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";

export const allMenuItems: Array<{
  title: string;
  Icon: React.ComponentType;
  href?: string;
  permission?: string | null;
  prefix?: string;
  disable?: boolean;
  children?: Array<{
    icon: React.ComponentType;
    title: string;
    nonPrefix?: boolean;
    href: string;
    permission?: string;
    disable?: boolean;
  }>;
}> = [
  // {
  //   title: "Tổng quan",
  //   href: "/center",
  //   Icon: AppstoreOutlined,
  //   permission: null,
  // },
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
        icon: IdcardOutlined,
        title: "Khách hàng",
        href: "/customers",
      },
      {
        icon: ContactsOutlined,
        title: "Leads",
        href: "/customers/leads",
      },
      {
        icon: CustomerServiceOutlined,
        title: "CSKH",
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
        icon: InboxOutlined,
        title: "Đơn hàng",
        href: "/sale/orders",
      },
      {
        icon: LayoutOutlined,
        nonPrefix: true,
        title: "Kanban",
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
        icon: ExperimentOutlined,
        title: "Sản xuất",
        href: "/workflow-management",
      },
      {
        icon: EnvironmentOutlined,
        title: "Theo dõi hàng hóa",
        href: "/product-tracking",
      },
      {
        icon: DatabaseOutlined,
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
        icon: MoneyCollectOutlined,
        title: "Thu Chi",
        href: "/finance",
      },
      {
        icon: CalculatorOutlined,
        disable: true,

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
        icon: IdcardOutlined,
        title: "Nhân viên",
        href: "/hr/members",
      },
      {
        icon: UserAddOutlined,
        title: "Tuyển dụng",
        href: "/hr/recruitment",
      },
      {
        icon: BookOutlined,
        title: "Đào tạo",
        href: "/hr/training",
      },
    ],
  },
  {
    title: "Kỹ thuật",
    Icon: ToolOutlined,
    href: "/technician",
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
          map[normalizePath(child.href)] = child.nonPrefix
            ? child.title
            : item.prefix + " " + child.title;
        }
      });
    }
  });

  return map;
}

export const breadcrumbMap: Record<string, string> = {
  ...generateBreadcrumbMap(allMenuItems),
};
