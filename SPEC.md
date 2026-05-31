# 每日时间块消消乐 — 规格文档 v2

## 变更

1. 时间块显示时间范围（如 06:00-08:30），而非单点时间
2. 新增历史记录查看功能，可查看每天的打卡记录

## 数据结构

```javascript
// localStorage key: "dayplan_YYYY-MM-DD"
{
  date: "2026-05-30",
  blocks: [
    { id: 1, timeStart: "06:00", timeEnd: "06:30", label: "游泳",  done: false, doneAt: null },
    { id: 2, timeStart: "08:30", timeEnd: "11:30", label: "聚焦工作", done: true, doneAt: "..." },
    ...
  ],
  coinCount: 3
}

// localStorage key: "dayplan_coinCount" — 全局累计金币
// localStorage key: "dayplan_date" — 当前查看的日期 (YYYY-MM-DD)
// localStorage key: "dayplan_allDates" — 所有有记录的天数列表 JSON array
```