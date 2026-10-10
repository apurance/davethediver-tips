import type { Article } from "../data";
import { Card, Tooltip, Button, Space, Tag } from "antd";
import { HeartFilled, HeartOutlined, BulbOutlined } from "@ant-design/icons";
import { phases } from "../data";
import { SourceLinks } from "./SourceLinks";

export function ArticleCard({
  article,
  saved,
  toggle,
  compact = false,
}: {
  article: Article;
  saved: boolean;
  toggle: () => void;
  compact?: boolean;
}) {
  return (
    <Card
      className="article-card"
      title={
        <div className="article-title">
          <span>{article.title}</span>
          <Tooltip title={saved ? "取消收藏" : "收藏这条攻略"}>
            <Button
              type="text"
              size="small"
              aria-label={`${saved ? "取消收藏" : "收藏"}：${article.title}`}
              icon={
                saved ? (
                  <HeartFilled style={{ color: "#087f8c" }} />
                ) : (
                  <HeartOutlined />
                )
              }
              onClick={toggle}
            />
          </Tooltip>
        </div>
      }
    >
      <Space size={4} wrap>
        <Tag color="cyan">{article.badge}</Tag>
        {article.phases.map((p) => (
          <Tag key={p}>{phases[p]}</Tag>
        ))}
      </Space>
      <p className="article-lead">{article.lead}</p>
      {compact ? (
        <p>{article.steps[0]}</p>
      ) : (
        <ol className="article-steps">
          {article.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
      <div className="guide-tip">
        <BulbOutlined />
        <span>{article.tip}</span>
      </div>
      <SourceLinks ids={article.sources} />
    </Card>
  );
}
