import { useRef, useState, type ComponentRef } from "react";
import { Button, Input, message, Modal, Space } from "antd";
import { parseAllocationPlanJson, serializeAllocationPlan, type AllocationPlanData } from "../allocationPlans";

type ClipboardMode = "import" | "export";
type ClipboardDialog = { mode: ClipboardMode; text: string; error?: string };

export function AllocationPlanClipboard({ plan, onImport }: {
  plan: AllocationPlanData;
  onImport: (plan: AllocationPlanData) => void;
}) {
  const [notice, noticeHolder] = message.useMessage();
  const [pending, setPending] = useState<ClipboardMode | null>(null);
  const [dialog, setDialog] = useState<ClipboardDialog | null>(null);
  const textArea = useRef<ComponentRef<typeof Input.TextArea>>(null);
  const exporting = dialog?.mode === "export";

  function importText(text: string, manual = false) {
    let imported: AllocationPlanData;
    try {
      imported = parseAllocationPlanJson(text);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "无法导入方案 JSON。";
      if (manual) setDialog({ mode: "import", text, error: reason });
      else void notice.error(reason);
      return;
    }
    onImport(imported);
    setDialog(null);
    void notice.success("方案已导入");
  }

  async function copyJson() {
    const text = serializeAllocationPlan(plan);
    setPending("export");
    try {
      await navigator.clipboard.writeText(text);
      void notice.success("方案 JSON 已复制到剪贴板");
    } catch {
      setDialog({ mode: "export", text });
    } finally {
      setPending(null);
    }
  }

  async function importFromClipboard() {
    setPending("import");
    try {
      const text = await navigator.clipboard.readText();
      importText(text);
    } catch {
      setDialog({ mode: "import", text: "" });
    } finally {
      setPending(null);
    }
  }

  return <>
    {noticeHolder}
    <Space wrap>
      <Button onClick={copyJson} loading={pending === "export"} disabled={pending === "import"}>复制方案 JSON</Button>
      <Button onClick={importFromClipboard} loading={pending === "import"} disabled={pending === "export"}>从剪贴板导入</Button>
    </Space>
    <Modal title={exporting ? "复制方案 JSON" : "粘贴方案 JSON"} open={dialog !== null}
      okText="导入" cancelText="取消" onCancel={() => setDialog(null)}
      onOk={() => { if (dialog?.mode === "import") importText(dialog.text, true); }}
      okButtonProps={{ disabled: !dialog?.text.trim() }}
      footer={exporting ? <Button type="primary" onClick={() => setDialog(null)}>完成</Button> : undefined}
      afterOpenChange={open => { if (open) textArea.current?.focus({ cursor: exporting ? "all" : "end" }); }}>
      <p className="muted small">{exporting ? "请手动复制下方的方案 JSON。" : "将导出的方案 JSON 粘贴到下方。"}</p>
      <Input.TextArea ref={textArea} aria-label="方案 JSON" rows={10} readOnly={exporting} value={dialog?.text ?? ""}
        status={dialog?.error ? "error" : undefined}
        onChange={event => setDialog({ mode: "import", text: event.target.value })} />
      {dialog?.error && <p role="alert" className="allocation-warning small">{dialog.error}</p>}
    </Modal>
  </>;
}
