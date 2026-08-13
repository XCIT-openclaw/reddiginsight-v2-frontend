# ReddigInsight 订阅功能手工测试用例

本文档覆盖本次新增的订阅升级、降级、取消，以及每计费周期仅允许变更一次的拦截逻辑。

## 测试前准备

- 已执行 V7 数据库迁移。
- Creem API Key 的 `Subscriptions` 权限为 `Read + Write`。
- Creem Webhook 已启用：
  - `checkout.completed`
  - `subscription.active`
  - `subscription.paid`
  - `subscription.update`
  - `subscription.canceled`
  - `subscription.scheduled_cancel`
  - `subscription.expired`
- 建议在 Vercel 部署环境执行，因为 Creem webhook 需要公网可访问的 `/api/webhooks/creem`。
- 准备测试账号：
  - `T-A`：无订阅的免费账号
  - `T-B`：Starter 订阅账号
  - `T-C`：Pro 订阅账号
- 测试前记录 Supabase 数据：
  - `users.credits`
  - `users.plan`
  - `subscriptions.plan_id`
  - `subscriptions.status`
  - `subscriptions.credits_per_month`
  - `subscriptions.pending_plan`
  - `subscriptions.plan_change_requested_at`
  - `subscriptions.current_period_end`
  - `transactions.payment_id`
  - `transactions.credits`
  - `transactions.status`

## 通用数据核对 SQL

```sql
select id, email, credits, plan
from public.users
order by created_at desc;

select user_id, plan_id, status, credits_per_month,
       pending_plan, plan_change_requested_at, current_period_end
from public.subscriptions
order by created_at desc;

select user_id, payment_id, amount, credits, status, completed_at
from public.transactions
order by created_at desc;
```

---

## 一、升级订阅

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-UP-01 | 升级后立即发放 Pro Credits | 使用 Starter 账号进入 `/pricing`，点击 `Upgrade to Pro` | 弹出成功提示；等待 webhook 后 `users.plan=pro`，`users.credits=30`；`subscriptions.plan_id=pro`，`credits_per_month=30`，`pending_plan=null`，`plan_change_requested_at` 有值；Dashboard 显示 30 Credits |
| TC-UP-02 | 升级按钮状态正确 | 观察 Pricing 卡片 | Starter 显示 `Current Plan` 且禁用；Pro 显示 `Upgrade to Pro`；请求期间按钮显示 `Processing...` 且其他按钮禁用 |
| TC-UP-03 | 升级后卡片状态切换 | 等待升级完成 | Pro 显示 `Current Plan`；Starter 显示 `Downgrade to Starter`；Pricing 页出现本周期已变更套餐提示 |
| TC-UP-04 | 升级失败不占用变更次数 | 用 F12 Console 调用缺少 `product_id` 的升级请求 | 返回 400 或 502；`subscriptions.plan_change_requested_at` 仍为 `null`；随后正常升级可以成功 |
| TC-UP-05 | 升级 webhook 不重复发 Credits | 升级后等待或触发 Creem 重复投递 webhook | `transactions` 不新增重复 Credits 记录；`users.credits` 不累加成 60 |

---

## 二、降级订阅

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-DN-01 | 降级仅记录待生效计划 | 使用 Pro 账号进入 `/pricing`，点击 `Downgrade to Starter` | 提示降级已排期；`users.plan` 仍为 `pro`；`users.credits` 仍为 30；`subscriptions.plan_id` 仍为 `pro`；`subscriptions.pending_plan=starter`；`plan_change_requested_at` 有值 |
| TC-DN-02 | 降级提示正确 | 查看 Pricing 和 Settings | Pricing 出现琥珀色提示，说明 Starter 将在下个周期生效；Settings 显示 `Your next plan is Starter` |
| TC-DN-03 | 降级后按钮禁用 | 再次进入 Pricing | 升降级按钮均不可点击；页面显示本周期已变更套餐的英文提示 |
| TC-DN-04 | 下周期生效 | 等待 Creem 进入下一计费周期并完成 `subscription.paid` | `users.plan=starter`；`users.credits=10`；`subscriptions.plan_id=starter`；`credits_per_month=10`；`pending_plan=null`；`plan_change_requested_at=null` |

---

## 三、取消订阅

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-CL-01 | 活跃订阅显示取消入口 | 使用活跃订阅账号进入 `/settings` | 显示 Subscription 卡片，包含当前套餐、状态、当前周期结束日期和 `Cancel Subscription` 按钮 |
| TC-CL-02 | 免费用户不显示取消入口 | 使用无订阅账号进入 `/settings` | 不显示 Subscription 卡片 |
| TC-CL-03 | 保留订阅操作 | 点击 `Cancel Subscription`，再点击 `Keep Subscription` | 弹窗关闭，不调用取消接口，订阅状态不变 |
| TC-CL-04 | 排期取消成功 | 点击 `Cancel Subscription`，确认弹窗中再次点击 `Cancel Subscription` | 弹出成功提示；按钮变为 `Cancellation Scheduled` 且禁用；等待 webhook 后 `subscriptions.status=scheduled_cancel` |
| TC-CL-05 | 取消后当前周期仍可用 | 当前周期结束前查看 Credits 和访问权限 | `users.credits` 不变，订阅仍保持访问权限 |
| TC-CL-06 | 周期末正式取消 | 等待 Creem 在周期末发送 `subscription.canceled` | `subscriptions.status=canceled`；页面不再显示取消按钮 |
| TC-CL-07 | 无订阅时取消返回 404 | 使用 `T-A` 直接调用 `/api/subscriptions/cancel` | 返回 404，提示无 Creem subscription |

---

## 四、每周期只允许变更一次

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-LMT-01 | UI 二次变更被禁用 | 本周期已完成一次升级或降级后进入 Pricing | 升降级按钮禁用；显示本周期已变更套餐提示 |
| TC-LMT-02 | API 二次变更返回 409 | 直接调用 `/api/subscriptions/upgrade` 或 `/api/subscriptions/update` | 返回 409，提示 `You can only change your subscription plan once per billing cycle.`，数据库状态不变 |
| TC-LMT-03 | 并发请求只允许一个成功 | 同时发出两个套餐变更请求 | 一个成功，另一个返回 409；不会调用两次 Creem |
| TC-LMT-04 | 新周期解除限制 | 上一周期已变更一次，并收到新的 `subscription.paid` | `plan_change_requested_at` 被清空；Pricing 页恢复可变更状态 |

---

## 五、新购买与 checkout 拦截

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-CH-01 | 免费账号首次购买 Starter | 使用 `T-A` 在 `/pricing` 点击 `Get 10 Credits`，完成 Creem 测试付款 | `users.plan=starter`；`users.credits=10`；`subscriptions` 创建 Starter 记录；`transactions` 只新增一条 10 Credits 记录，不重复发两次 |
| TC-CH-02 | 已有订阅用户不能创建新 Checkout | 使用 `T-B` 直接调用 `/api/checkout` 创建 Pro checkout | 返回 409；不跳转 Creem；不创建新 checkout |
| TC-CH-03 | 付款跳转回来不重复加 Credits | 付款后等待 Dashboard 跳转，并多次刷新页面 | Credits 不重复增加；`verify-checkout` 返回 pending 或已处理，最终以 webhook 结果为准 |

---

## 六、Webhook 与数据库状态回归

| ID | 场景 | 预期结果 |
| --- | --- | --- |
| TC-WH-01 | `subscription.update` 升级 | `subscriptions.plan_id=pro`，`users.credits=30` |
| TC-WH-02 | `subscription.update` 降级 | `subscriptions.plan_id` 仍为当前套餐，只写 `pending_plan` |
| TC-WH-03 | `subscription.paid` 交易去重 | 不同计费周期各生成一条 transaction；重复投递同一支付事件不会重复加 Credits |
| TC-WH-04 | `subscription.canceled` 状态同步 | `subscriptions.status=canceled` |
| TC-WH-05 | `subscription.expired` 重置 Credits | `users.credits=0`，`users.plan=free` 或 `expired`，订阅状态为 `expired` |
| TC-WH-06 | 非法 webhook 签名 | `/api/webhooks/creem` 返回 401，且不修改数据库 |

---

## 最终通过标准

- 所有 TC 执行结果符合预期。
- 升级、降级、取消的 UI 与 API 行为一致。
- `users.credits`、`subscriptions.pending_plan`、`plan_change_requested_at`、`status` 与 Creem 实际状态一致。
- `transactions` 无重复 Credits 记录。
- 同一个订阅周期内第二次套餐变更始终被拦截。