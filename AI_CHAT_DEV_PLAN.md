# AI Chat 对话功能开发计划

## 一、需求分析

### 核心功能：AI Idea 研讨室
用户通过对话式交互，在 AI 引导下澄清产品想法，最终生成 Reddit 分析参数。

### 用户流程
1. 用户点击"开始分析"
2. 进入 AI Chat 界面
3. AI 发起引导式对话：
   - "你想分析什么产品或想法？"
   - "你的目标用户是谁？"
   - "有什么特定的关键词要追踪？"
   - "想关注多长时间范围的数据？"
4. AI 汇总确认后，自动生成搜索参数
5. 用户确认后开始分析

### 需要收集的信息
| 信息 | 提问方式 | 存储字段 |
|------|----------|----------|
| 产品描述 | 开放式提问 | product_idea |
| 目标用户 | 引导式提问 | target_audience |
| 关键词 | 确认式提问 | keywords[] |
| 时间范围 | 选择式提问 | time_range |
| 关注subreddit | 确认式提问 | subreddits[] |

---

## 二、技术架构

### 前端组件
```
src/app/chat/
├── page.tsx          # Chat 主页面
├── layout.tsx        # Chat 布局
└── components/
    ├── ChatMessage.tsx    # 消息组件
    ├── ChatInput.tsx      # 输入框组件
    ├── TypingIndicator.tsx # 打字指示器
    └── ChatHistory.tsx    # 对话历史
```

### 后端 API
```
src/app/api/chat/
├── route.ts          # POST: 发送消息，流式响应
└── history/
    └── route.ts      # GET: 获取历史对话
```

### LLM 配置
```env
# OpenRouter (推荐，支持多模型)
OPENROUTER_API_KEY=sk-or-xxx

# 或直接使用阿里云百炼
ALIBABA_API_KEY=sk-xxx

# 模型选择 (可通过环境变量切换)
CHAT_MODEL=kimi-k2.5  # 或 qwen3-plus
```

---

## 三、开发任务分解

### Phase 1: 基础架构 (使用 oh-my-opencode 分工)
- [ ] Task 1.1: 创建 Chat 页面路由和布局
- [ ] Task 1.2: 创建 ChatMessage 组件
- [ ] Task 1.3: 创建 ChatInput 组件
- [ ] Task 1.4: 创建 TypingIndicator 组件

### Phase 2: AI 对话 API
- [ ] Task 2.1: 创建 /api/chat 路由
- [ ] Task 2.2: 实现 OpenRouter/阿里云 API 调用
- [ ] Task 2.3: 实现流式响应 (Streaming)
- [ ] Task 2.4: 实现对话历史存储

### Phase 3: 引导式对话逻辑
- [ ] Task 3.1: 设计 System Prompt
- [ ] Task 3.2: 实现信息收集状态机
- [ ] Task 3.3: 实现参数汇总和确认
- [ ] Task 3.4: 集成到分析流程

### Phase 4: UI 优化 (使用 UI-UX-pro-max)
- [ ] Task 4.1: 重新设计 Chat 界面
- [ ] Task 4.2: 优化 Dashboard 和 Reports 页面
- [ ] Task 4.3: 添加动效和过渡
- [ ] Task 4.4: 移动端优化

---

## 四、实现步骤

### Step 1: 创建 Chat 页面基础结构
使用 opencode 创建基础组件和路由。

### Step 2: 实现 AI 对话 API
配置 LLM 调用，支持流式响应。

### Step 3: 实现前端流式渲染
使用 React Stream 或自定义实现。

### Step 4: 设计引导式对话 Prompt
让 AI 能够自然地引导用户。

### Step 5: UI 重设计
使用 UI-UX-pro-max 插件优化界面。

### Step 6: 集成测试
端到端测试完整流程。

---

## 五、环境变量配置

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://jodnxkcwgxamjrdydlzz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=sb_secret_YOUR_SUPABASE_SERVICE_KEY

# OpenRouter (LLM)
OPENROUTER_API_KEY=sk-or-v1-YOUR_OPENROUTER_KEY

# Chat Model (可选: kimi-k2.5, qwen3-plus, claude-3.5-haiku)
CHAT_MODEL=kimi-k2.5

# Apify (Reddit Crawler)
APIFY_API_KEY=apify_api_YOUR_APIFY_TOKEN

# Creem (Payment)
CREEM_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

---

## 六、System Prompt 设计

```
你是 ReddigInsight 的 AI 产品顾问。你的任务是通过对话帮助用户澄清他们想要分析的产品或想法。

## 你的职责
1. 友好地问候用户，解释你的作用
2. 通过引导式提问收集以下信息：
   - 产品/想法描述
   - 目标用户群体
   - 关注的关键词
   - 数据时间范围
   - 相关的 Reddit 社区

## 对话风格
- 友好、专业、简洁
- 一次只问一个问题
- 用自然的对话方式，不要像问卷
- 适时总结确认已收集的信息

## 对话流程
1. 开场：询问用户想分析什么
2. 深入：根据回答追问细节
3. 确认：汇总信息让用户确认
4. 提交：生成分析参数

## 输出格式
当信息收集完毕后，输出 JSON 格式的分析参数：
```json
{
  "ready": true,
  "params": {
    "product_idea": "...",
    "target_audience": "...",
    "keywords": ["...", "..."],
    "time_range": "month",
    "subreddits": ["...", "..."]
  }
}
```

开始对话吧！
```

---

## 七、预期效果

用户进入 Chat 界面后：

```
AI: 你好！我是 ReddigInsight 的 AI 顾问。我可以帮你分析 Reddit 上对某个产品或想法的讨论。

你想分析什么？可以是一个产品、一个想法，或者你想了解的话题。

User: 我想分析大家对 AI 编程助手的看法

AI: 有趣的话题！AI 编程助手确实是热门领域。

你的目标用户是谁？比如是开发者、产品经理，还是更广泛的群体？

User: 主要是开发者

AI: 明白了。你关注哪些特定的 AI 编程工具？比如 GitHub Copilot、Cursor、还是更广泛的讨论？

User: 我主要想看 Cursor 和 Windsurf 的对比

AI: 好的，让我确认一下：

- 🎯 产品/想法: AI 编程助手对比分析
- 👥 目标用户: 开发者
- 🔍 关键词: Cursor, Windsurf, AI编程助手
- 📅 时间范围: 最近一个月

这样对吗？需要调整吗？

User: 对的，开始分析吧！

AI: [生成分析参数，跳转到分析页面]
```

---

**制定时间**: 2026-03-27
**预计开发时间**: 4-6 小时