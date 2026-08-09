# ReddigInsight MVP 端到端测试用例

## 测试环境
- URL: https://reddiginsight-v2.vercel.app
- 测试账号: testuser2026@test.com
- 密码: Test123456!

## 测试用例

### TC-001: 首页加载
- 访问 https://reddiginsight-v2.vercel.app
- 验证页面正常加载
- 验证渐变背景显示
- 验证导航栏存在

### TC-002: 用户注册
- 访问 /signup
- 输入新邮箱和密码
- 点击注册
- 验证跳转到 dashboard
- 验证显示 1 积分

### TC-003: 用户登录
- 访问 /login
- 输入测试账号: testuser2026@test.com
- 输入密码: Test123456!
- 点击登录
- 验证跳转到 dashboard

### TC-004: Dashboard 积分显示
- 登录后访问 /dashboard
- 验证显示用户积分
- 验证统计卡片显示

### TC-005: 创建分析报告
- 在 Dashboard 输入 subreddit: programming
- 点击 Generate Report
- 验证扣减积分
- 验证报告出现在列表

### TC-006: AI Chat 对话
- 访问 /chat
- 验证 AI 欢迎消息显示
- 输入: "我想分析 AI 编程工具"
- 验证 AI 返回响应

### TC-007: 报告列表
- 访问 /reports
- 验证显示报告列表
- 验证状态显示正确

### TC-008: 定价页面
- 访问 /pricing
- 验证显示三档价格 ($9.9, $24.9, $69.9)
- 验证购买按钮存在

### TC-009: 设置页面
- 访问 /settings
- 验证显示用户邮箱
- 验证退出登录按钮

### TC-010: 退出登录
- 点击退出登录
- 验证返回首页
- 验证无法访问 /dashboard

### TC-011: 忘记密码页面
- 访问 /forgot-password
- 输入邮箱
- 点击发送
- 验证显示成功消息

### TC-012: 移动端响应式
- 在移动端尺寸测试首页
- 验证布局正确
- 验证导航菜单可用