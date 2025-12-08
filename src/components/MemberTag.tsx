import { FirebaseWorkflowData } from "@/types/order";
import { findMemberByKeyFromMap } from "@/utils/mapItem";
import { TeamOutlined } from "@ant-design/icons";
import { Typography } from "antd";

const { Text } = Typography;
const MemberTag = ({
  workflows,
  members,
}: {
  workflows: FirebaseWorkflowData[];
  members: any;
}) => {
  return (
    <div className="mt-2 flex items-center gap-1">
      <TeamOutlined className="text-xs text-gray-500" />
      <Text className="text-xs text-gray-600 truncate">
        {workflows
          .filter((workflow) => workflow)
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0]?.members
          ? workflows
              .filter((workflow) => workflow)
              .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0]
              .members.map(
                (emp) => findMemberByKeyFromMap(members, emp)?.name || ""
              )
              .join(", ")
          : ""}
      </Text>
    </div>
  );
};

export default MemberTag;
