"use client";

import { Tabs } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode } from "react";

export default function WorkflowsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Determine active tab based on pathname
  const activeKey = pathname.endsWith("/workers")
    ? "workers"
    : pathname.endsWith("/workflows")
    ? "workflows"
    : "departments";

  const items = [
    {
      key: "departments",
      label: "Phòng ban",
    },
    {
      key: "workflows",
      label: "Quy trình",
    },
    {
      key: "workers",
      label: "Thợ nghề",
    },
  ];

  const handleTabChange = (key: string) => {
    if (key === "workflows") {
      router.push("/technician/workflows");
    } else if (key === "workers") {
      router.push("/technician/workers");
    } else {
      router.push("/technician");
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
