# 修复 MVP 测试失败问题

## 问题描述

MVP 完整业务功能测试发现 3 个失败项：

### 问题 1：Dashboard URL 参数丢失

**现象**：
- 访问 `/dashboard?subreddit=programming&keywords=AI%20tools&timeRange=month`
- 输入框值为空，URL 参数未自动填充
- 控制台日志显示参数全部为空

**根因**：
- `src/middleware.ts` 重定向到登录页时，只保存了 pathname，丢失了 searchParams
- 代码：`url.searchParams.set('redirect', request.nextUrl.pathname)` - 只保存了路径，没有保存查询参数

**修复方案**：
修改 `src/middleware.ts`，保存完整的 URL（包括 searchParams）：

```typescript
// 修改前
url.searchParams.set('redirect', request.nextUrl.pathname)

// 修改后
url.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
```

### 问题 2：Chat 页面 AuthContext 超时

**现象**：
- 登录后访问 Chat 页面，控制台报错：`AuthSessionMissingError`
- 然后警告：`Auth loading timeout - clearing all auth states`
- 15 秒后页面仍无输入框/按钮

**根因**：
- `src/contexts/AuthContext.tsx` 中 `AUTH_LOADING_TIMEOUT = 10000`（10秒）
- Supabase session 验证太慢（网络延迟）
- 10 秒超时后清除 auth 状态，导致 Chat 页面组件无法渲染

**修复方案**：
修改 `src/contexts/AuthContext.tsx`，增加超时时间到 30 秒：

```typescript
// 修改前
const AUTH_LOADING_TIMEOUT = 10000

// 修改后
const AUTH_LOADING_TIMEOUT = 30000
```

## 验收标准

修复后，以下测试应全部通过：

1. ✅ 访问 `/dashboard?subreddit=programming&keywords=AI%20tools&timeRange=month`，输入框自动填充对应值
2. ✅ 登录后访问 Chat 页面，10 秒内能看到输入框和发送按钮
3. ✅ Dashboard 页面正常显示所有输入框和按钮

## 注意事项

- 不要修改测试脚本，只修复前端代码
- 修改后需要 build 成功
- 保持现有功能不变
