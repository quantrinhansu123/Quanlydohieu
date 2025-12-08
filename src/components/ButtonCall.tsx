import { PhoneOutlined } from "@ant-design/icons";
import { Button } from "antd";

const ButtonCall = ({ phone }: { phone: string }) => {
  return (
    <Button
      type="primary"
      icon={<PhoneOutlined />}
      onClick={() => {
        window.location.href = `tel:${phone}`;
      }}
    >
      Gọi điện
    </Button>
  );
};

export default ButtonCall;
