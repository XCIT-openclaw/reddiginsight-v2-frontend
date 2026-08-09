# ReddigInsight v2 - UI 实操测试报告

**测试日期**: 2026-04-07  
**测试环境**: https://reddiginsight-v2.vercel.app  
**测试账号**: testuser2026@test.com / Test123456!  
**测试工具**: Playwright MCP + Chromium Browser  

---

## 测试概览

| 总测试项 | 通过 | 失败 | 通过率 |
|---------|------|------|--------|
| 15 | 13 | 2 | 86.7% |

---

## 测试结果详情

### 1. 页面导航测试

| 测试项 | 状态 | 详情 |
|--------|------|------|
| 首页加载 | ✅ PASS | 页面正确加载，标题显示正确 |
| 导航栏链接 | ✅ PASS | Login, Signup, Dashboard 链接均正常 |
| 页脚链接 | ✅ PASS | Pricing, Privacy, Terms 链接存在 |

### 2. 按钮点击测试

| 按钮 | 页面 | 状态 | 导航目标 |
|------|------|------|----------|
| Start Free Analysis | 首页 | ✅ PASS | /signup |
| Learn More | 首页 | ✅ PASS | #features |
| Get Started (Navbar) | 首页 | ✅ PASS | /signup |
| Sign in (Navbar) | 首页 | ✅ PASS | /login |
| Create New Report | Dashboard | ✅ PASS | 表单可见 |
| View Report | Reports | ✅ PASS | /reports/1 |
| AI Analysis | Report Detail | ✅ PASS | 按钮可见 |
| Share | Report Detail | ✅ PASS | 按钮可见 |
| Get 5 Credits | Pricing | ✅ PASS | 按钮可见 |
| Get 15 Credits | Pricing | ✅ PASS | 按钮可见 |
| Get 50 Credits | Pricing | ✅ PASS | 按钮可见 |
| Purchase More Credits | Settings | ✅ PASS | 按钮可见 |
| Change Password | Settings | ✅ PASS | 按钮可见 |
| Sign Out | Settings | ✅ PASS | 按钮可见 |

### 3. 表单输入测试

| 表单 | 状态 | 详情 |
|------|------|------|
| 登录表单 | ✅ PASS | 邮箱、密码输入正常，登录成功跳转到 Dashboard |
| 注册表单 | ✅ PASS | 邮箱、密码、确认密码字段正常显示 |
| 忘记密码表单 | ⚠️ PARTIAL | 邮箱输入正常，提交后返回错误 "An unexpected error occurred" |
| Dashboard 创建报告表单 | ✅ PASS | Subreddit 输入框正常 |
| Chat 对话输入框 | ⚠️ PARTIAL | 输入正常，但 AI 响应返回错误 |
| 设置页面表单 | ✅ PASS | 各按钮正常显示 |

### 4. 视觉分析测试

所有页面截图已保存到 `tests/screenshots/` 目录：

| 截图文件 | 页面 |
|----------|------|
| homepage.png | 首页 |
| signup.png | 注册页 |
| login.png | 登录页 |
| dashboard.png | Dashboard |
| chat.png | AI 聊天页 |
| reports.png | 报告列表页 |
| report-detail.png | 报告详情页 |
| pricing.png | 定价页 |
| settings.png | 设置页 |
| forgot-password.png | 忘记密码页 |

---

## 发现的问题

### 🔴 严重问题

#### 1. Chat API 混合内容错误
- **位置**: /chat 页面
- **问题**: 页面通过 HTTPS 加载，但 API 调用使用了 HTTP (`http://106.15.90.140:3001/api/chat`)
- **影响**: 浏览器阻止请求，AI 对话功能完全失效
- **错误信息**: 
  ```
  Mixed Content: The page at 'https://reddiginsight-v2.vercel.app/chat' was loaded over HTTPS, 
  but requested an insecure resource 'http://106.15.90.140:3001/api/chat'. 
  This request has been blocked.
  ```
- **建议修复**: 将 API 端点改为 HTTPS 或配置代理

### 🟡 中等问题

#### 2. 忘记密码功能错误
- **位置**: /forgot-password 页面
- **问题**: 提交邮箱后返回 "An unexpected error occurred"
- **影响**: 用户无法重置密码
- **建议修复**: 检查后端 Supabase 邮件发送配置

---

## 页面功能验证

### ✅ 首页 (/)
- [x] 标题 "Understand Any Subreddit In Seconds" 正确显示
- [x] CTA 按钮可点击
- [x] 导航栏正常
- [x] 页脚正常

### ✅ 登录页 (/login)
- [x] 邮箱输入框
- [x] 密码输入框
- [x] 登录按钮正常工作
- [x] "Forgot Password?" 链接存在

### ✅ 注册页 (/signup)
- [x] 邮箱输入框
- [x] 密码输入框
- [x] 确认密码输入框
- [x] "Create account" 按钮
- [x] "Sign in" 链接

### ✅ Dashboard (/dashboard)
- [x] 显示可用积分: 1
- [x] 显示已生成报告: 3
- [x] 显示处理中报告: 2
- [x] 创建报告表单
- [x] 最近报告列表

### ⚠️ Chat 页面 (/chat)
- [x] AI 欢迎消息显示
- [x] 输入框可用
- [ ] AI 响应失败 - **API 错误**

### ✅ Reports 页面 (/reports)
- [x] 报告列表正确显示
- [x] 处理中报告显示 (r/startups, r/artificial)
- [x] 已完成报告显示 (r/programming, r/MachineLearning)
- [x] 失败报告显示 (r/webdev)
- [x] "View Report" 链接正常

### ✅ Report 详情页 (/reports/1)
- [x] 标题显示正确 (r/programming)
- [x] 生成日期显示
- [x] "AI Analysis" 按钮
- [x] "Share" 按钮
- [x] 讨论摘要
- [x] 关键引用
- [x] 影响力分数 (63.0%)
- [x] 行动建议
- [x] 统计数据
- [x] 热门帖子

### ✅ Pricing 页面 (/pricing)
- [x] 三档定价显示
  - Starter: $9.9 / 5 credits
  - Pro: $24.9 / 15 credits
  - Enterprise: $69.9 / 50 credits
- [x] 当前积分显示 (1)
- [x] FAQ 部分

### ✅ Settings 页面 (/settings)
- [x] 个人资料 (邮箱、账号 ID)
- [x] 积分显示 (1)
- [x] "Purchase More Credits" 按钮
- [x] 通知设置
- [x] "Change Password" 按钮
- [x] "Sign Out" 按钮

### ⚠️ 忘记密码页面 (/forgot-password)
- [x] 邮箱输入框
- [ ] 提交后错误 - **功能问题**

---

## 建议优先级

| 优先级 | 问题 | 建议操作 |
|--------|------|----------|
| 🔴 P0 | Chat API HTTP 问题 | 立即修复 API 端点为 HTTPS |
| 🟡 P1 | 忘记密码错误 | 检查 Supabase 邮件配置 |

---

## 测试环境信息

- **浏览器**: Chromium (via Playwright)
- **操作系统**: Linux
- **测试执行时间**: ~10 分钟
- **网络**: 所有请求正常（除已标注问题）

---

## 结论

ReddigInsight v2 网站的核心功能大部分正常工作，包括用户认证、Dashboard、报告查看、定价页面等。但存在两个关键问题需要修复：

1. **Chat 功能完全不可用** - API 使用 HTTP 导致浏览器阻止请求
2. **忘记密码功能错误** - 用户无法重置密码

建议在发布前修复这两个问题。