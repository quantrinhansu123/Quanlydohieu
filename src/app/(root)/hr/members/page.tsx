"use client";

import CommonTable, { PropRowDetails } from "@/components/CommonTable";
import WrapperContent from "@/components/WrapperContent";
import useFilter from "@/hooks/useFilter";
import { DepartmentService, IDepartment } from "@/services/departmentService";
import { MemberService } from "@/services/memberService";
import { RoleLabels, ROLES, RolesOptions } from "@/types/enum";
import { IMembers } from "@/types/members";
import { generateRandomCode } from "@/utils/generateRandomCode";
import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Switch,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

const { Option } = Select;

// Member Details Drawer Component
const MemberDetails: React.FC<PropRowDetails<IMembers>> = ({
  data,
  onClose,
}) => {
  const [departments, setDepartments] = useState<IDepartment[]>([]);

  useEffect(() => {
    const unsubscribe = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!data) return null;

  const getDepartmentNames = (codes?: string[]) => {
    if (!codes || codes.length === 0) return "N/A";
    return codes
      .map((code) => departments.find((d) => d.code === code)?.name || code)
      .join(", ");
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Thông tin nhân viên</h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <span className="font-medium">Họ tên:</span>
            <p className="text-gray-600">{data.name}</p>
          </div>
          <div>
            <span className="font-medium">Số điện thoại:</span>
            <p className="text-gray-600">{data.phone}</p>
          </div>
          <div>
            <span className="font-medium">Email:</span>
            <p className="text-gray-600">{data.email}</p>
          </div>
          <div>
            <span className="font-medium">Chức vụ:</span>
            <p className="text-gray-600">
              {RoleLabels[data.role] || data.role}
            </p>
          </div>
          {data.role === ROLES.worker && (
            <div>
              <span className="font-medium">Phòng ban:</span>
              <p className="text-gray-600">
                {getDepartmentNames(data.departments)}
              </p>
            </div>
          )}
          <div>
            <span className="font-medium">Ngày sinh:</span>
            <p className="text-gray-600">
              {dayjs(data.date_of_birth).format("DD/MM/YYYY")}
            </p>
          </div>
          <div>
            <span className="font-medium">Trạng thái:</span>
            <p className="text-gray-600">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  data.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {data.isActive !== false ? "Hoạt động" : "Ngừng hoạt động"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Member Form Component
interface MemberFormProps {
  member?: IMembers;
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const MemberForm: React.FC<MemberFormProps> = ({
  member,
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<IDepartment[]>([]);
  const [selectedRole, setSelectedRole] = useState<ROLES | null>(null);
  const { message } = App.useApp();

  // Load departments
  useEffect(() => {
    const unsubscribe = DepartmentService.onSnapshot((data) => {
      setDepartments(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (member && visible) {
      form.resetFields();
      setSelectedRole(member.role);
      form.setFieldsValue({
        ...member,
        date_of_birth: member.date_of_birth
          ? dayjs(member.date_of_birth)
          : null,
      });
    } else {
      form.resetFields();
      setSelectedRole(null);
      form.setFieldsValue({
        code: generateRandomCode("MEM_"),
        isActive: true,
      });
    }
  }, [member, visible, form]);

  const getErrorMessage = (error: any): string => {
    // Handle API errors
    if (error.message) {
      return error.message;
    }

    // Handle Firebase Auth errors
    switch (error.code) {
      case "auth/email-already-in-use":
        return "Email này đã được sử dụng";
      case "auth/invalid-email":
        return "Email không hợp lệ";
      case "auth/operation-not-allowed":
        return "Đăng ký email/mật khẩu chưa được kích hoạt";
      case "auth/weak-password":
        return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn";
      default:
        return "Đăng ký thất bại. Vui lòng thử lại";
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Remove departments field if role is not worker
      const memberData = {
        ...values,
        date_of_birth: values.date_of_birth?.format("YYYY-MM-DD"),
        departments:
          values.role === ROLES.worker ? values.departments : values.role,
      };

      if (member?.id) {
        // For updates, use updateWithPassword to handle password changes
        // Only pass password if it's provided (not empty)
        const passwordToUpdate =
          values.password && values.password.trim() !== ""
            ? values.password
            : undefined;
        await MemberService.updateWithPassword(
          member.id,
          memberData,
          passwordToUpdate
        );
        message.success("Cập nhật nhân viên thành công!");
      } else {
        // For new members, use create (which already handles password)
        await MemberService.create(memberData);
        message.success("Thêm nhân viên thành công!");
      }

      onSuccess();
      onCancel();
    } catch (error) {
      console.error("Error saving member:", error);
      message.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={member ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={member ? "Mã nhân viên" : "Mã nhân viên (Tự động tạo)"}
          name="code"
          required
        >
          <Input placeholder="Nhập mã nhân viên" disabled />
        </Form.Item>
        <Form.Item name="id" style={{ display: "none" }}>
          <Input hidden className="fixed" />
        </Form.Item>
        <Form.Item
          label="Họ tên"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
        >
          <Input placeholder="Nhập họ tên" />
        </Form.Item>

        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[
            { required: true, message: "Vui lòng nhập số điện thoại!" },
            {
              pattern: /^[0-9]{10,11}$/,
              message: "Số điện thoại không hợp lệ!",
            },
          ]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Vui lòng nhập email!" },
            { type: "email", message: "Email không hợp lệ!" },
          ]}
        >
          <Input placeholder="Nhập email" />
        </Form.Item>
        <Form.Item
          label="Mật khẩu"
          name="password"
          rules={[
            {
              required: !member,
              message: "Vui lòng nhập mật khẩu!",
            },
            { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={
              member ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu"
            }
            type="password"
          />
        </Form.Item>

        <Form.Item
          label="Ngày sinh"
          name="date_of_birth"
          rules={[{ required: true, message: "Vui lòng chọn ngày sinh!" }]}
        >
          <DatePicker
            placeholder="Chọn ngày sinh"
            format="DD/MM/YYYY"
            className="w-full"
          />
        </Form.Item>

        <Form.Item
          label="Chức vụ"
          name="role"
          rules={[{ required: true, message: "Vui lòng chọn chức vụ!" }]}
        >
          <Select
            placeholder="Chọn chức vụ"
            allowClear
            options={RolesOptions}
            onChange={(value) => {
              setSelectedRole(value);
              // Clear departments when role changes
              if (value !== ROLES.worker) {
                form.setFieldValue("departments", undefined);
              }
            }}
          />
        </Form.Item>

        {selectedRole === ROLES.worker && (
          <Form.Item
            label="Phòng ban"
            name="departments"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn ít nhất một phòng ban!",
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn phòng ban"
              allowClear
              options={departments.map((dept) => ({
                label: dept.name,
                value: dept.code,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item
          label="Trạng thái hoạt động"
          name="isActive"
          valuePropName="checked"
        >
          <Switch
            checkedChildren="Hoạt động"
            unCheckedChildren="Ngừng hoạt động"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Main Members Page Component
const MembersPage = () => {
  const [members, setMembers] = useState<IMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<IMembers | undefined>();
  const { message } = App.useApp();
  const { query, applyFilter, updateQueries, reset } = useFilter();
  const filteredMembers = applyFilter(members);

  // Load data
  useEffect(() => {
    const unsubscribeMembers = MemberService.onSnapshot((data) => {
      setMembers(data);
      setLoading(false);
    });

    return () => {
      unsubscribeMembers();
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await MemberService.delete(id);
      message.success("Xóa nhân viên thành công!");
    } catch (error) {
      console.error("Error deleting member:", error);
      message.error("Có lỗi xảy ra khi xóa nhân viên!");
    }
  };

  const columns: TableColumnsType<IMembers> = [
    {
      title: "Họ tên",
      dataIndex: "name",
      key: "name",
      sorter: true,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Chức vụ ",
      dataIndex: "role",
      key: "role",
      render: (role: ROLES) => RoleLabels[role] || role,
    },
    {
      title: "Ngày sinh",
      dataIndex: "date_of_birth",
      key: "date_of_birth",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    // {
    //   title: "Trạng thái",
    //   dataIndex: "isActive",
    //   key: "isActive",
    //   width: 120,
    //   render: (isActive: boolean) => (
    //     <span
    //       className={`px-2 py-1 rounded-full text-xs font-medium ${
    //         isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
    //       }`}
    //     >
    //       {isActive !== false ? "Hoạt động" : "Ngừng hoạt động"}
    //     </span>
    //   ),
    // },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingMember(record);
              setFormVisible(true);
            }}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa nhân viên này?"
            onConfirm={() => handleDelete(record.code)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <WrapperContent
      title="Quản lý Nhân viên"
      header={{
        searchInput: {
          placeholder: "Tìm kiếm nhân viên...",
          filterKeys: ["name", "email", "phone", "role", "isActive"],
        },
        filters: {
          fields: [
            {
              label: "Chức vụ ",
              name: "role",
              type: "select",
              options: RolesOptions,
            },
            {
              label: "Trạng thái",
              name: "isActive",
              type: "select",
              options: [
                { label: "Tất cả", value: "" },
                { label: "Hoạt động", value: true },
                { label: "Ngừng hoạt động", value: false },
              ],
            },
          ],
          query,
          onApplyFilter: updateQueries,
          onReset: reset,
        },
        buttonEnds: [
          {
            can: true,
            type: "primary",
            name: "Thêm nhân viên",
            icon: <PlusOutlined />,
            onClick: () => {
              setEditingMember(undefined);
              setFormVisible(true);
            },
          },
        ],
      }}
      isLoading={loading}
    >
      <CommonTable
        dataSource={filteredMembers.reverse()}
        columns={columns}
        loading={loading}
        DrawerDetails={MemberDetails}
        paging={true}
        rank={true}
      />

      <MemberForm
        member={editingMember}
        visible={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingMember(undefined);
        }}
        onSuccess={() => {
          // Data will be updated through realtime listener
        }}
      />
    </WrapperContent>
  );
};

export default MembersPage;
