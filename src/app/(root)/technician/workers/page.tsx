"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import { FilterList } from "@/components/FilterList";
import useFilter from "@/hooks/useFilter";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DepartmentService, IDepartment } from "@/services/departmentService";
import { MemberService } from "@/services/memberService";
import { ROLES } from "@/types/enum";
import { IMembers } from "@/types/members";
import { ClearOutlined, FilterOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import { Button, Drawer, Form, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

// Worker Details Drawer Component
const WorkerDetails: React.FC<PropRowDetails<IMembers>> = ({
  data,
  onClose,
}) => {
  const [departments, setDepartments] = useState<IDepartment[]>([]);

  useEffect(() => {
    const unsubscribe = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
    });
    return () => unsubscribe();
  }, []);

  if (!data) return null;

  const workerDepartments = data.departments
    ?.map((deptCode) => departments.find((d) => d.code === deptCode))
    .filter(Boolean) as IDepartment[];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Thông tin thợ nghề</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Mã nhân viên:</span>
            <p className="text-gray-600">{data.code}</p>
          </div>
          <div>
            <span className="font-medium">Họ và tên:</span>
            <p className="text-gray-600">{data.name}</p>
          </div>
          <div>
            <span className="font-medium">Email:</span>
            <p className="text-gray-600">{data.email}</p>
          </div>
          <div>
            <span className="font-medium">Số điện thoại:</span>
            <p className="text-gray-600">{data.phone || "N/A"}</p>
          </div>
          <div>
            <span className="font-medium">Ngày sinh:</span>
            <p className="text-gray-600">
              {data.date_of_birth
                ? dayjs(data.date_of_birth).format("DD/MM/YYYY")
                : "N/A"}
            </p>
          </div>
          <div>
            <span className="font-medium">Phòng ban phụ trách:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {workerDepartments && workerDepartments.length > 0 ? (
                workerDepartments.map((dept) => (
                  <Tag key={dept.code} color="blue">
                    {dept.name}
                  </Tag>
                ))
              ) : (
                <span className="text-gray-400">Chưa được phân công</span>
              )}
            </div>
          </div>
          <div>
            <span className="font-medium">Trạng thái:</span>
            <div className="mt-1">
              <Tag color={data.isActive ? "green" : "red"}>
                {data.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
              </Tag>
            </div>
          </div>
          <div>
            <span className="font-medium">Ngày tạo:</span>
            <p className="text-gray-600">
              {data.createdAt
                ? dayjs(data.createdAt).format("DD/MM/YYYY HH:mm")
                : "N/A"}
            </p>
          </div>
          <div>
            <span className="font-medium">Cập nhật lần cuối:</span>
            <p className="text-gray-600">
              {data.updatedAt
                ? dayjs(data.updatedAt).format("DD/MM/YYYY HH:mm")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Workers Page Component
const WorkersPage = () => {
  const [workers, setWorkers] = useState<IMembers[]>([]);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [form] = Form.useForm();
  const isMobile = useIsMobile();
  const { query, applyFilter, updateQueries, reset } = useFilter();

  // Apply filters
  let filteredWorkers = applyFilter(workers);
  console.log(query, filteredWorkers, workers);
  // Filter by department if selected

  // Load data
  useEffect(() => {
    const unsubscribeMembers = MemberService.onSnapshot((data) => {
      // Filter only workers (role === ROLES.worker)
      const workersOnly = data.filter((member) => member.role === ROLES.worker);
      setWorkers(workersOnly);
      setLoading(false);
    });

    const unsubscribeDepartments = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
    });

    return () => {
      unsubscribeMembers();
      unsubscribeDepartments();
    };
  }, []);

  // Sync form values with query when filter drawer opens
  useEffect(() => {
    if (filterVisible) {
      form.setFieldsValue(query);
    }
  }, [filterVisible, query, form]);

  const columns: TableColumnsType<IMembers> = [
    {
      title: "Mã NV",
      dataIndex: "code",
      key: "code",
      sorter: true,
      width: 120,
      render: (code: string) => (
        <Typography.Text strong className="font-mono text-xs">
          {code}
        </Typography.Text>
      ),
    },
    {
      title: "Họ và tên",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => phone || "N/A",
    },
    {
      title: "Phòng ban",
      dataIndex: "departments",
      key: "departments",
      render: (departmentCodes: string[]) => {
        if (!departmentCodes || departmentCodes.length === 0) {
          return <span className="text-gray-400">Chưa phân công</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {departmentCodes.map((deptCode) => {
              const dept = departments.find((d) => d.code === deptCode);
              return (
                <Tag key={deptCode} color="blue">
                  {dept?.name || deptCode}
                </Tag>
              );
            })}
          </div>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Hoạt động" : "Ngưng"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: number) =>
        date ? dayjs(date).format("DD/MM/YYYY") : "N/A",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Danh sách nhân viên kỹ thuật</h2>
          <p className="text-gray-500 text-sm mt-1">
            Hiển thị: {filteredWorkers.length} / {workers.length} thợ nghề
          </p>
        </div>
        <div className="flex gap-2">
          {Object.keys(query).length > 0 && (
            <Button
              icon={<ClearOutlined />}
              onClick={() => {
                reset();
                form.resetFields();
              }}
            >
              Xóa bộ lọc
            </Button>
          )}
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterVisible(true)}
          >
            Bộ lọc
          </Button>
        </div>
      </div>

      <Drawer
        title="Bộ lọc"
        placement="right"
        onClose={() => setFilterVisible(false)}
        open={filterVisible}
        size={isMobile ? "default" : "large"}
      >
        <FilterList
          form={form}
          isMobile={isMobile}
          fields={[
            {
              label: "Phòng ban",
              name: "departments",
              type: "select",
              options: departments.map((dept) => ({
                label: dept.name,
                value: dept.code,
              })),
            },
            {
              label: "Trạng thái",
              name: "isActive",
              type: "select",
              options: [
                { label: "Đang hoạt động", value: "true" },
                { label: "Ngưng hoạt động", value: "false" },
              ],
            },
          ]}
          onApplyFilter={(params) => {
            updateQueries(params);
            setFilterVisible(false);
          }}
          onReset={() => {
            reset();
            form.resetFields();
          }}
          onCancel={() => setFilterVisible(false)}
        />
      </Drawer>

      <CommonTable
        dataSource={filteredWorkers}
        columns={columns}
        loading={loading}
        DrawerDetails={WorkerDetails}
        paging={true}
        rank={true}
      />
    </div>
  );
};

export default WorkersPage;
