# 每日时间块消消乐 — 规格文档 v2

## 变更

1. 时间块显示时间范围（如 06:00-08:30），而非单点时间
2. 新增历史记录查看功能，可查看每天的打卡记录
3. 日程类型：**工作日** / **周末**（按星期自动）+ **出差**（顶栏勾选）；Tab 显示「今日打卡（工作日）」或「今日打卡（周末）」

## 数据结构

```javascript
// localStorage key: "dayplan_YYYY-MM-DD"
{
  date: "2026-05-30",
  trip: false,
  workflow: "workday",  // workday | weekend | trip
  blocks: [
    { id: 1, timeStart: "06:00", timeEnd: "06:30", label: "游泳",  done: false, doneAt: null },
    { id: 2, timeStart: "08:30", timeEnd: "11:30", label: "聚焦工作", done: true, doneAt: "..." },
    ...
  ],
  coinCount: 3
}

// localStorage key: "dayplan_coinCount" — 全局累计金币（顶栏展示）
// localStorage key: "dayplan_date" — 当前查看的日期 (YYYY-MM-DD)，刷新后恢复
// localStorage key: "dayplan_allDates" — 至少完成过 1 个时间块的日期列表（JSON array）
```

## 行为约定

- 仅「今天」可打卡；查看历史日期时为只读
- 历史列表仅包含至少完成过 1 块的日子；仅翻页浏览不会写入
- 某日全部完成后显示庆祝页（任意日期）；重置会扣回该日已获得的全球金币
- 顶栏金币为 `dayplan_coinCount` 全局累计；`plan.coinCount` 为当日获得数
- 周一至周五默认 **工作日** 表，周六日默认 **周末** 表；勾选 **出差** 后使用出差表（有打卡进度时会确认并重置）
- 时段块（`period: true`）不显示时长