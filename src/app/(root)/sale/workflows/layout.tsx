"use client";

import { useSetTitlePage } from "@/hooks/useSetTitlePage";
import { Tabs } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function WorkflowsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  useSetTitlePage("Quản lý phòng kỹ thuật");

  // Determine active tab based on pathname
  const activeKey = pathname.endsWith("/workers")
    ? "workers"
    : pathname.endsWith("/departments")
    ? "departments"
    : "workflows";

  const items = [
    {
      key: "workflows",
      label: "Quy trình",
    },
    {
      key: "departments",
      label: "Phòng ban kỹ thuật",
    },
    {
      key: "workers",
      label: "Thợ nghề",
    },
  ];

  const handleTabChange = (key: string) => {
    if (key === "workflows") {
      router.push("/sale/workflows");
    } else if (key === "departments") {
      router.push("/sale/workflows/departments");
    } else if (key === "workers") {
      router.push("/sale/workflows/workers");
    }
  };

  return (
    <>
      <Tabs
        type="card"
        activeKey={activeKey}
        items={items}
        onChange={handleTabChange}
        size="large"
        className="mb-4"
      />
      <div>{children}</div>
    </>
  );
}
