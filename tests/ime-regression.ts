// Browser integration test: run /tests/ime-regression.html with the Vite dev server.
const frame = document.querySelector<HTMLIFrameElement>("#app")!;
const results = document.querySelector<HTMLPreElement>("#results")!;
const run = document.querySelector<HTMLButtonElement>("#run")!;
let assertions = 0;
const check = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
  assertions++;
};
async function until(predicate: () => boolean) {
  const deadline = Date.now() + 6000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("等待页面或搜索状态超时");
    await new Promise(resolve => setTimeout(resolve, 16));
  }
}
const win = () => frame.contentWindow! as Window & typeof globalThis;
const input = (label: string) => frame.contentDocument!.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
const params = () => new URL(win().location.href).searchParams;
const settle = () => new Promise(resolve => setTimeout(resolve, 60));
async function load(route: string, label: string) {
  frame.src = route;
  await until(() => frame.contentWindow?.location.pathname === route.split("?")[0] && !!input(label));
}
function composition(label: string, type: "compositionstart" | "compositionend", data = "") {
  input(label).dispatchEvent(new (win().CompositionEvent)(type, { bubbles: true, data }));
}
function setValue(label: string, value: string) {
  const field = input(label);
  Object.getOwnPropertyDescriptor(win().HTMLInputElement.prototype, "value")!.set!.call(field, value);
}
function change(label: string, value: string, isComposing = false) {
  setValue(label, value);
  const field = input(label);
  field.dispatchEvent(new (win().InputEvent)("input", { bubbles: true, data: value, isComposing, inputType: isComposing ? "insertCompositionText" : "insertText" }));
}

run.addEventListener("click", async () => {
  run.disabled = true;
  assertions = 0;
  results.textContent = "运行中…";
  try {
    const searches = [
      { route: "/recipes", label: "搜索食谱数据库", parameter: "name" },
      { route: "/ingredients", label: "搜索食材数据库", parameter: "name" },
      { route: "/fish", label: "搜索鱼类数据库", parameter: "name" },
      { route: "/staff", label: "搜索员工数据库", parameter: "name" },
      { route: "/recipes", label: "搜索攻略", parameter: "q" },
    ];
    for (const search of searches) {
      await load(search.route, search.label);
      composition(search.label, "compositionstart");
      for (const preedit of ["t", "ta", "tai", "tai't", "tai'ta", "tai'tan"]) {
        change(search.label, preedit, true);
        await settle();
        check(input(search.label).value === preedit, `${search.label}: 拼音草稿被覆盖或重复`);
        check(params().get(search.parameter) === null, `${search.label}: 选词期间触发搜索`);
        check(win().location.pathname === search.route, `${search.label}: 选词期间切换页面`);
      }
      // Chromium: the final composed input arrives before compositionend.
      change(search.label, "泰坦", true);
      composition(search.label, "compositionend", "泰坦");
      change(search.label, "泰坦");
      await until(() => params().get(search.parameter) === "泰坦");
      await settle();
      check(input(search.label).value === "泰坦", `${search.label}: 确认后的汉字混入了拼音`);

      // Also cover browsers which send the final change after compositionend.
      composition(search.label, "compositionstart");
      change(search.label, "泰坦hu", true);
      setValue(search.label, "泰坦虎");
      composition(search.label, "compositionend", "虎");
      change(search.label, "泰坦虎");
      await until(() => params().get(search.parameter) === "泰坦虎");
      await settle();
      check(input(search.label).value === "泰坦虎", `${search.label}: 连续中文输入重复`);

      change(search.label, "tuna");
      await until(() => params().get(search.parameter) === "tuna");
      await settle();
      check(input(search.label).value === "tuna", `${search.label}: 英文输入没有正常搜索`);
      const clear = input(search.label).closest(".ant-input-affix-wrapper")!.querySelector<HTMLElement>(".ant-input-clear-icon")!;
      clear.click();
      await until(() => params().get(search.parameter) === null);
      await settle();
      check(input(search.label).value === "", `${search.label}: 清空没有同步到输入框`);
    }

    await load("/search?q=泰坦", "搜索攻略");
    composition("搜索攻略", "compositionstart");
    change("搜索攻略", "泰坦hu", true);
    input("搜索攻略").dispatchEvent(new (win().KeyboardEvent)("keydown", { key: "Escape", isComposing: true, bubbles: true }));
    await settle();
    check(win().location.pathname === "/search" && params().get("q") === "泰坦", "输入法 Escape 错误退出搜索页");
    change("搜索攻略", "泰坦", true);
    composition("搜索攻略", "compositionend");
    check(input("搜索攻略").value === "泰坦", "取消选词后输入被污染");

    await load("/recipes?name=虎鲨", "搜索食谱数据库");
    check(input("搜索食谱数据库").value === "虎鲨", "URL 中的搜索条件没有填入输入框");
    win().history.pushState(null, "", "/recipes?name=泰坦");
    win().dispatchEvent(new (win().PopStateEvent)("popstate"));
    await until(() => input("搜索食谱数据库").value === "泰坦");
    win().history.back();
    await until(() => input("搜索食谱数据库").value === "虎鲨");
    check(params().get("name") === "虎鲨", "返回页面后输入框与搜索条件不同步");
    results.textContent = `PASS · ${assertions} 项断言通过：5 个搜索框、拼音组合输入、连续汉字、英文、清空、Escape 和返回页面。`;
  } catch (error) {
    results.textContent = `FAIL · 已通过 ${assertions} 项断言\n${error instanceof Error ? error.message : String(error)}`;
  } finally { run.disabled = false; }
});
