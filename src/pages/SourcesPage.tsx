import { Alert, Collapse, List, Space, Tag } from "antd";
import { sources } from "../data";
import { ExportOutlined } from "@ant-design/icons";
import { SourceLinks } from "../components/SourceLinks";
import { PageHeading } from "../components/PageHeading";

export function SourcesPage() {
  return (
    <>
      <PageHeading />
      <Alert
        showIcon
        type="info"
        title="依据与推荐分开阅读"
        description="官方页面用于核对发布与内容范围；Wiki、社区实测用于玩法数据；组合、优先级与日程是本文据此给出的建议。没有对所有平台和补丁进行实机验证，不承诺唯一全局最优。"
      />
      <Collapse
        className="methodology"
        defaultActiveKey={["scope"]}
        items={[
          {
            key: "scope",
            label: "版本、译名与“最优”定义",
            children: (
              <>
                <p>
                  检索整理日期：2026-10-09。本体完整玩法为主，丛林为可执行附录；未宣称覆盖所有联动的全收集或全部新料理。中文名仅用于阅读，容易混淆的鱼和员工保留英文名。
                </p>
                <p>
                  本文把最优拆为：省操作、稳定持续收入、活捉效率、推进速度和收集便利。推荐取决于已解锁内容、材料与员工等级；数值表使用代表性菜谱，非全量游戏数据库。
                </p>
                <p>
                  员工经理的等级门槛基于旧版实测，换人后以游戏显示确认。绯红鱼卷的美味值在部分旧网站有冲突，本页采用与现行
                  Wiki 汇总一致的 258；其他关键价格和份数交叉核对。
                </p>
              </>
            ),
          },
          {
            key: "calc",
            label: "计算器公式与限制",
            children: (
              <>
                <p>
                  预计销量 = floor(主店客流 × 服务率) + floor(分店客流 ×
                  服务率)。各店批次数单独按销量 / 每批盘数向上取整，原料 =
                  总批次数 × 每批用量。
                </p>
                <p>
                  料理收入 = 实际盘数 × 单份价 + 加成盘数 × 单份价 × (倍率 −
                  1)。加成盘数不超过实际盘数；总收入不包含饮料、小费或随机增产。扣成本后的数值只扣除你填写的成本。
                </p>
                <p>
                  可持续盘数 = min(floor(各原料日产出 / 每批用量)) ×
                  每批盘数。它是供给瓶颈模型，不是游戏繁殖概率模型。
                </p>
              </>
            ),
          },
          {
            key: "storage",
            label: "本地数据与离线使用",
            children: (
              <p>
                收藏、阶段筛选、剧透偏好和清单存储在当前浏览器
                localStorage。没有账号或上传请求；应用正常使用不需要实时网络。打开来源链接仍需联网。清理浏览器站点数据会清除这些记录，计算盘数不自动保存。
              </p>
            ),
          },
        ]}
      />
      <List
        className="source-list"
        dataSource={sources}
        renderItem={(s, i) => (
          <List.Item>
            <div className="source-item">
              <span className="source-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <Space wrap>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    <strong>{s.name}</strong> <ExportOutlined />
                  </a>
                  <Tag>{s.type}</Tag>
                </Space>
                <p>{s.note}</p>
              </div>
            </div>
          </List.Item>
        )}
      />
      <p className="muted">
        CJ Bot 员工指南的可读镜像：
        <a
          href="https://steamsolo.com/guide/staff-hiring-training-and-arrangement-dave-the-diver/"
          target="_blank"
          rel="noreferrer"
        >
          SteamSolo
        </a>
        。所有正文均为中文归纳与建议，未复制整篇原文；插画为原创示意
        SVG，不是游戏地图。
      </p>
      <SourceLinks ids={["official", "jungle"]} />
    </>
  );
}
