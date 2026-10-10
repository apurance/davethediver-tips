import { useSaved } from "../hooks/useSaved";
import { Card, Popconfirm, Button, Progress, Checkbox } from "antd";
import { dailyTasks } from "../data";

export function DailyChecklist() {
  const [checks, setChecks] = useSaved<string[]>("bluehole.checks.v1", []);
  return (
    <Card
      title="今天该做什么"
      extra={
        <Popconfirm
          title="开始新的一天，清空已完成项？"
          onConfirm={() => setChecks([])}
          okText="清空"
          cancelText="取消"
        >
          <Button type="text" size="small">
            重置
          </Button>
        </Popconfirm>
      }
    >
      <div className="check-progress">
        <span>
          本地保存 · {checks.length} / {dailyTasks.length}
        </span>
        <Progress
          percent={Math.round((checks.length / dailyTasks.length) * 100)}
          size="small"
          showInfo={false}
        />
      </div>
      {dailyTasks.map((task) => (
        <div
          className={`task ${checks.includes(task.id) ? "task-done" : ""}`}
          key={task.id}
        >
          <Checkbox
            checked={checks.includes(task.id)}
            onChange={(e) =>
              setChecks(
                e.target.checked
                  ? [...checks, task.id]
                  : checks.filter((v) => v !== task.id),
              )
            }
          >
            <span className="task-time">{task.time}</span>
            <strong>{task.title}</strong>
            <span className="task-desc">{task.desc}</span>
          </Checkbox>
        </div>
      ))}
    </Card>
  );
}
