# ReddigInsight 订阅功能手工测试用例

> 本文档已按当前正式版实现同步，覆盖首次购买、取消、恢复、临时功能门禁和 webhook 回归。
> 当前前端未提供暂停订阅入口；暂停 API 已存在但不在本手工测试范围内，如需要可单独补测。

## Temporary production-release gate

While Creem investigates HTTP 403 responses from its plan-change endpoint, upgrade/downgrade is temporarily disabled for production release. Existing implementation is retained behind `PLAN_CHANGE_FEATURE_ENABLED` and must not be removed.

| ID | Scenario | Expected result |
| --- | --- | --- |
| TC-GATE-01 | Paid subscriber opens Pricing | The current paid plan is disabled as Current Plan and shows the Settings cancellation reminder; the other paid plan is disabled as Plan Changes Unavailable; schedule-upgrade/downgrade hints and pending-plan banners are hidden |
| TC-GATE-02 | Directly call /api/subscriptions/upgrade or /api/subscriptions/update | Returns 503 with plan changes temporarily unavailable; no Creem plan-change request is sent and database pending fields remain unchanged |
| TC-GATE-03 | Free user purchases Starter or Pro | Checkout remains enabled and behaves normally |
| TC-GATE-04 | Subscriber cancels or reactivates | Subscription lifecycle actions remain enabled and behave normally |

## Required test-reset rule

Before reusing an account that has subscribed, always cancel its existing Creem subscription(s) and wait for the terminal state first. Only after Creem is clean should you clear or reset the Supabase subscription data. Never clear Supabase first: doing so can leave orphaned active subscriptions in Creem that continue renewing and corrupt later tests.

## 测试前准备

- 已执行数据库迁移：
  - `V5__add_subscriptions_table.sql`
  - `V6__add_pending_checkouts.sql`（可选，当前代码未依赖此表）
  - `V7__add_subscription_plan_changes.sql`
  - `V8__add_subscription_update_policy.sql`
- Creem API Key 权限：
  - `Checkouts`：Read + Write
  - `Customers`：Read + Write（metadata 同步需要）
  - `Products`：Read
  - `Subscriptions`：Read + Write
  - `Transactions`：Read（可选，用于核对交易金额）
- Creem Webhook 已启用：
  - `checkout.completed`
  - `subscription.active`
  - `subscription.paid`
  - `subscription.update`
  - `subscription.scheduled_cancel`
  - `subscription.canceled`
  - `subscription.expired`
  - `subscription.past_due`
  - `subscription.unpaid`
  - `refund.created`（可选）
- 环境变量已配置：
  - `CREEM_API_KEY`
  - `CREEM_API_URL=https://test-api.creem.io/v1`
  - `CREEM_WEBHOOK_SECRET`（注意末尾不要有多余换行）
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- 建议在 Vercel 生产或可公网访问的测试环境执行，因为 Creem webhook 需要访问 `/api/webhooks/creem`。
- 准备测试账号：
  - `T-A`：无订阅的免费账号
  - `T-B`：Starter 订阅账号
  - `T-C`：Pro 订阅账号
- 测试前记录基准数据：
  - `users.credits`、`users.plan`
  - `subscriptions.plan_id`、`status`、`credits_per_month`、`pending_plan`、`plan_change_requested_at`、`current_period_start`、`current_period_end`
  - `transactions.user_id`、`payment_id`、`amount`、`credits`、`status`、`completed_at`
  - 可选：使用 `GET /v1/customers?email=...` 查看 Creem customer metadata

## 通用数据核对 SQL

```sql
select id, email, credits, plan
from public.users
order by created_at desc;

select user_id, plan_id, status, credits_per_month,
       pending_plan, plan_change_requested_at,
       current_period_start, current_period_end, updated_at
from public.subscriptions
order by created_at desc;

select user_id, payment_id, amount, credits, status, completed_at
from public.transactions
order by created_at desc;
```

> `amount` 的当前口径：`subscription.paid` 使用 `eventObject.amount / 100`。如果 Creem payload 未传 `amount`，该字段会记为 0。功能验证以 `credits` 为准。

---


## 一、取消订阅与恢复

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-CL-01 | 活跃订阅显示取消入口 | 使用活跃订阅账号进入 `/settings` | 显示 Subscription 卡片，包含当前套餐、状态、当前周期结束日期和 `Cancel Subscription` 按钮 |
| TC-CL-02 | 免费用户不显示取消入口 | 使用无订阅账号进入 `/settings` | 不显示 Subscription 卡片 |
| TC-CL-03 | 保留订阅操作 | 点击 `Cancel Subscription`，在弹窗中点击 `Keep Subscription` | 弹窗关闭，不调用取消接口，订阅状态不变 |
| TC-CL-04 | 排期取消成功 | 点击 `Cancel Subscription`，确认弹窗中再次点击 `Cancel Subscription` | 弹出成功提示；按钮变为 `Cancellation Scheduled` 且禁用；`subscriptions.status=scheduled_cancel` |
| TC-CL-05 | 排期取消后当前周期仍可用 | 当前周期结束前查看 Credits 和访问权限 | `users.credits` 不变；`users.plan` 不变；当前周期内订阅仍保持访问权限 |
| TC-CL-06 | 排期取消到期后降回 Free | 等待排期取消到周期末，收到 `subscription.expired` | `subscriptions.status=expired`；`users.plan=free`；`users.credits=0`；页面不再显示 Subscription 卡片 |
| TC-CL-07 | 无订阅时取消返回 404 | 使用 `T-A` 直接调用 `/api/subscriptions/cancel` | 返回 404，提示无 Creem subscription |
| TC-CL-08 | 排期取消后恢复 | 在 `scheduled_cancel` 状态进入 `/settings`，点击 `Reactivate Subscription` | 弹出成功提示；`subscriptions.status` 回到 active；Subscription 卡片恢复显示当前套餐和 `Cancel Subscription` 按钮 |
| TC-CL-09 | Pricing 页反映排期取消状态 | 在 `scheduled_cancel` 状态进入 `/pricing` | 显示取消提示；非当前套餐按钮被禁用；提示用户到 Settings 恢复订阅 |
| TC-CL-10 | 立即取消终态降回 Free | 通过 Creem Dashboard 或 API 立即取消一个订阅，触发 `subscription.canceled` | `subscriptions.status=canceled`；`users.plan=free`；`users.credits=0`；页面不再显示 Subscription 卡片 |
| TC-CL-11 | `scheduled_cancel` 不清零 | 收到 `subscription.scheduled_cancel` webhook 后检查 | `users.plan/credits` 保持不变；只有 `subscriptions.status=scheduled_cancel` 被更新 |
| TC-CL-12 | Dashboard reactivation restores Pricing plan state | Schedule cancellation from Pro, reactivate the subscription manually in the Creem dashboard, then open /pricing | users.plan=pro; subscriptions.plan_id=pro, status=active; Pricing shows Pro as Current Plan and disabled; Starter shows Plan Changes Unavailable |
| TC-CL-13 | Terminal subscription rejects lifecycle actions | Use a user whose subscription row is canceled or expired but still retains creem_subscription_id; call cancel, pause, or resume directly | Every action returns 404 with no active subscription; Creem API is not called; database state remains unchanged |

---


## 二、新购买与 checkout 拦截

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-CH-01 | 免费账号首次购买 Starter | 使用 `T-A` 在 `/pricing` 点击 `Get 10 Credits`，完成 Creem 测试付款 | `users.plan=starter`；`users.credits=10`；`subscriptions` 创建 Starter 记录；`transactions` 只新增一条 10 Credits 记录，不重复发两次 |
| TC-CH-02 | 已有订阅用户不能创建新 Checkout | 使用 `T-B` 直接调用 `/api/checkout` 创建 Pro checkout | 返回 409；不跳转 Creem；不创建新 checkout |
| TC-CH-03 | 付款跳转回来不重复加 Credits | 付款后等待 Dashboard 跳转，并多次刷新页面 | Credits 不重复增加；`verify-checkout` 对订阅产品返回 pending 或已处理；最终以 `subscription.paid` 为准 |
| TC-CH-05 | Checkout verification stops after navigation | Complete payment, then navigate from Dashboard to another page while credit verification is still pending | The payment URL is consumed immediately; no delayed success toast appears on the other page; returning to Dashboard does not replay the Payment received toast; credits continue to be granted by the webhook |
| TC-CH-06 | Creem orphan subscription blocks new checkout | Delete or terminal-mark the local Supabase row only for setup, while the same Creem customer still has an active/scheduled/past-due/paused/unpaid subscription; then call /api/checkout | Returns 409 with the existing Creem subscription context; no Creem checkout URL is created; investigate and cancel the orphan in Creem before continuing tests |

---

## 三、Webhook 与数据库状态回归

| ID | 场景 | 预期结果 |
| --- | --- | --- |
| TC-WH-03 | subscription.paid transaction dedup | Deliver paid events for different billing periods, then redeliver the same payment event | Each valid billing period creates one transaction; duplicate payment delivery adds no Credits and does not revert to an older plan state |
| TC-WH-04 | `subscription.scheduled_cancel` 状态同步 | `subscriptions.status=scheduled_cancel`；不清零 credits |
| TC-WH-05 | `subscription.expired` resets subscription and credits | `users.credits=0`; `users.plan=free`; `subscriptions.status=expired`; `subscriptions.plan_id=free`; `subscriptions.credits_per_month=NULL`; `pending_plan=null`; `plan_change_requested_at=null` |
| TC-WH-06 | 非法 webhook 签名 | `/api/webhooks/creem` 返回 401，且不修改数据库 |
| TC-WH-07 | `subscription.canceled` terminal reset | `subscriptions.status=canceled`; `subscriptions.plan_id=free`; `subscriptions.credits_per_month=NULL`; `pending_plan=null`; `plan_change_requested_at=null`; `users.plan=free`; `users.credits=0` |
| TC-WH-08 | `subscription.paid` records the real paid amount | Complete a real paid subscription event and inspect the transaction row | The handler uses `last_transaction_id` to call `GET /v1/transactions`; `transactions.amount` equals the Creem-paid amount (for example 9.90 for Starter); Credits still follow the paid plan. If the lookup temporarily fails, credits are not blocked and the amount remains 0 for reconciliation follow-up |
| TC-WH-10 | `refund.created` 退款回归 | 写一条负数 transaction；用户 credits 按原交易 credits 扣回，且不低于 0 |
| TC-WH-12 | Metadata sync retries by email | Send a new subscription.paid event with a unique payment/transaction ID and a stale or synthetic customer ID that returns 404; preserve a valid metadata.user_id or subscription ID, and use a user whose registered email matches a real Creem customer | The main webhook state and transaction are processed; the handler logs the event-customer failure, retries by email, and customer metadata becomes the active plan and credits. A redelivered old payment must not create another transaction or revert metadata to the old event plan |
| TC-WH-13 | Different active subscription cannot overwrite local state | With the local active subscription bound to sub_new, deliver checkout.completed, subscription.active, subscription.paid, or subscription.update for a different sub_old | The webhook returns 200, logs the blocked subscription conflict, changes no user/subscription/transaction data, and does not replace creem_subscription_id |
| TC-WH-14 | Terminal event self-heals a deleted local subscription row | Delete only the local subscriptions row, then deliver subscription.canceled/expired/unpaid for that same Creem subscription with metadata.user_id or customer.email | The webhook resolves the user, sees no remaining active subscription, resets users.plan=free and users.credits=0, and syncs customer metadata to free/0 |
| TC-WH-15 | Terminal event cannot clear a different active subscription | Delete only the old local subscription row, create or restore a different active subscription for the same user, then deliver the old subscription terminal event | The user plan/credits and the active subscription row remain unchanged; the webhook logs that another active subscription blocked the reset |

---

## 最终通过标准

- 所有 TC 执行结果符合预期。
- 取消、恢复的 UI 与 API 行为一致。
- `users.credits` 和 `subscriptions.status` 与 Creem 实际状态一致。
- `transactions` 无重复 Credits 记录。
- 排期取消到期通过 `subscription.expired` 降回 Free；立即取消通过 `subscription.canceled` 降回 Free。
