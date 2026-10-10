import { Button, Result } from "antd";
import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <Result
      status="404"
      title="页面未找到"
      subTitle="这个地址没有对应的攻略页面。"
      extra={
        <Link to="/">
          <Button type="primary">返回概览</Button>
        </Link>
      }
    />
  );
}
