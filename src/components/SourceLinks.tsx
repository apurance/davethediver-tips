import { FileSearchOutlined, ExportOutlined } from "@ant-design/icons";
import { sources } from "../data";

export function SourceLinks({ ids }: { ids: string[] }) {
  return (
    <div className="source-links">
      <FileSearchOutlined />
      <span>依据</span>
      {ids.map((id) => {
        const s = sources.find((v) => v.id === id);
        return s ? (
          <a key={id} href={s.url} target="_blank" rel="noreferrer">
            {s.name}
            <ExportOutlined />
          </a>
        ) : null;
      })}
    </div>
  );
}
