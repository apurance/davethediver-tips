import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import App from "./App";
import "antd/dist/reset.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#087f8c",
          colorText: "#102e43",
          colorTextSecondary: "#5d7382",
          borderRadius: 8,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif',
          colorBorderSecondary: "#e4ebee",
        },
        components: {
          Menu: {
            darkItemBg: "#102e43",
            darkSubMenuItemBg: "#102e43",
            darkItemSelectedBg: "#1b4b5f",
          },
          Card: { headerFontSize: 16 },
          Tabs: { horizontalItemGutter: 28 },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
