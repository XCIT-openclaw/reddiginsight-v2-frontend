# 修复 MVP 测试发现的问题

## 问题描述

MVP 完整业务功能测试发现 3 个失败项（通过率 57.1% → 目标 100%）：

### 问题 1：Chat 页面认证超时导致输入框不显示

**现象**：
- 登录后访问 Chat 页面，控制台报错：`AuthSessionMissingError: Auth session missing!`
- 然后警告：`Auth loading timeout - clearing all auth states and redirecting`
- 15 秒后页面仍无输入框/按钮，只有 loading 状态
- 但页面 HTML 中包含 "Hello! I'm your Reddit Insight AI consultant" 文本

**根因分析**：
- `src/contexts/AuthContext.tsx` 中 `AUTH_LOADING_TIMEOUT = 10000`（10秒）
- Supabase session 验证太慢（网络延迟或 API 响应慢）
- 10 秒超时后清除 auth 状态，导致 Chat 页面组件无法渲染输入框

**修复方案**：
1. 增加 `AUTH_LOADING_TIMEOUT` 到 30000（30秒）
2. 或者优化 session 验证逻辑，使用更快的验证方式
3. 添加重试机制，超时后不立即清除状态，而是重试 2-3 次

**文件**：`src/contexts/AuthContext.tsx`（约第 22 行）

### 问题 2：Dashboard URL 参数自动填充不生效

**现象**：
- 访问 `/dashboard?subreddit=programming&keywords=AI%20tools&timeRange=month`
- 输入框值为空，URL 参数未自动填充
- 控制台日志：`[SearchParamsHandler] URL params: {subredditParam: , keywordsParam: , timeRangeParam: }`（全部为空）

**根因分析**：
- Next.js 15 使用 `searchParams` Promise，需要 `await` 或 `use()` 
- 可能 `SearchParamsHandler` 组件未正确获取 URL 参数
- 或者 `useSearchParams()` 在客户端渲染时参数丢失

**修复方案**：
1. 检查 `src/app/dashboard/page.tsx` 中 `searchParams` 的使用方式
2. 确保 `SearchParamsHandler` 组件正确从 URL 读取参数
3. 验证参数传递给表单输入框的流程

**文件**：`src/app/dashboard/page.tsx`

### 问题 3：Reddit 爬取功能输入框未找到

**现象**：
- 与问题 2 相同，Dashboard 页面的输入框在登录后访问时未渲染

**根因**：
- 可能是问题 1 的连锁反应（认证超时导致页面组件未渲染）
- 或者是 Next.js 流式 SSR 导致客户端 hydration 延迟

**修复方案**：
- 修复问题 1 后，此问题应该自动解决
- 如果仍有问题，检查 Dashboard 页面的 hydration 逻辑

## 验收标准

修复后，以下测试应全部通过：

1. ✅ 登录后访问 Chat 页面，10 秒内能看到输入框和发送按钮
2. ✅ 访问 `/dashboard?subreddit=programming&keywords=AI%20tools&timeRange=month`，输入框自动填充对应值
3. ✅ 登录后 Dashboard 页面正常显示所有输入框和按钮

## 注意事项

- 不要修改测试脚本，只修复前端代码
- 修改后需要 build 成功
- 保持现有功能不变
