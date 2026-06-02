# 每日时间块消消乐 — 规格文档 v3

## 变更

1. 时间块显示时间范围（如 06:00-08:30），而非单点时间
2. 新增历史记录查看功能，可查看每天的打卡记录
3. 日程类型：**工作日** / **周末**（按星期自动）+ **出差**（顶栏勾选）；Tab 显示「今日打卡（工作日）」或「今日打卡（周末）」

## 数据结构

```javascript
// localStorage key: "dayplan_YYYY-MM-DD"
{
  date: "2026-05-30",          // ISO 日期 (YYYY-MM-DD)
  trip: false,                 // 是否为出差日
  workflow: "workday",         // workday | weekend | trip
  blocks: [
    {
      id: 0,                   // 0..N-1
      timeStart: "06:40",      // 24h 制；时段块可为 "白天" / "傍晚"
      timeEnd: "07:10",        // 时段块为 null
      label: "游泳",
      period: false,           // true = 时段块（无具体结束时间）
      done: false,
      doneAt: null
    },
    {
      id: 1,
      timeStart: "白天",
      timeEnd: null,
      label: "按出差流程工作",
      period: true,
      done: false,
      doneAt: null
    }
  ],
  coinCount: 3
}

// localStorage key: "dayplan_coinCount" — 全局累计金币（顶栏展示；首次启动从各日 coinCount 汇总迁移）
// localStorage key: "dayplan_date" — 当前查看的日期 (YYYY-MM-DD)，刷新后恢复
// localStorage key: "dayplan_allDates" — 至少完成过 1 个时间块的日期列表（JSON array；启动时自愈清理）
```

## 行为约定

- 周一至周五默认 **工作日** 表，周六日默认 **周末** 表；勾选 **出差** 后使用出差表（有打卡进度时会确认并重置）
- 仅「今天」可点击打卡；查看历史日期时方块为只读（无勾选事件）
- 历史列表仅包含至少完成过 1 块的日子；仅翻页浏览不会写入 `allDates`
- 某日全部完成后显示庆祝页（任意日期都可触发）；点击「重置当日 / 重置今日」会清零当天进度并扣回该日已获得的全局金币
- 顶栏金币为 `dayplan_coinCount` 全局累计；`plan.coinCount` 为当日获得数
- 时段块（`period: true`）不显示时长，跨午夜时间会按 `start < end` 修正（睡眠 22:40→06:00 视为次日 7h20m）
- 旧数据兼容：旧版 `time` 字段在 `getPlan` 时自动迁移到 `timeStart`；缺失 / 数量不符的日程会自动按当前 weekday+出差 重排，并尽量保留**同名**块的打勾状态
- 顶栏文案：Tab 显示「今日打卡（工作日 / 周末）」随查看日变化；状态栏左为日期切换、中为进度、右为金币；历史页整条状态栏隐藏