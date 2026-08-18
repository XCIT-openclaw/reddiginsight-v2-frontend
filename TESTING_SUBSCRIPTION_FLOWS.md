# ReddigInsight 订阅功能手工测试用例

> 本文档已按当前代码实现同步，覆盖首次购买、升级、降级、取消、恢复、套餐变更限制和 webhook 回归。
> 当前前端未提供暂停订阅入口；暂停 API 已存在但不在本手工测试范围内，如需要可单独补测。

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

## 一、升级订阅

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-UP-01 | 升级立即生效并稳定到账 | 使用 Starter 账号进入 `/pricing`，点击 `Upgrade to Pro` | API 返回 200 后立即查库：`users.plan=pro`、`users.credits=30`；`subscriptions.plan_id=pro`、`credits_per_month=30`、`pending_plan=null`、`plan_change_requested_at` 非空；等待 `subscription.update` 和 `subscription.paid` 到达后再查一次，仍应为 `pro/30`，不能回退或累加到 60 |
| TC-UP-02 | 升级按钮状态正确 | 观察 Pricing 卡片 | Starter 显示 `Current Plan` 且禁用；Pro 显示 `Upgrade to Pro`；请求期间显示处理状态且其他按钮禁用 |
| TC-UP-03 | 升级后卡片状态切换 | 等待升级完成 | Pro 显示 `Current Plan`；Starter 显示 `Downgrade to Starter`；Pricing 页出现本周期已变更套餐提示 |
| TC-UP-04 | 升级失败不占用变更次数 | 直接调用 `/api/subscriptions/upgrade`，请求体缺少 `product_id` | 返回 400；`subscriptions.plan_change_requested_at` 仍为 null；随后补齐 `product_id` 重新升级可以成功 |
| TC-UP-05 | Upgrade proration does not grant full credits | After upgrade, wait for subscription.update and subscription.paid | Only one proration transaction is recorded with 20 credits. users.credits keeps the calculated balance (for example 25 when 5 credits remained); it must not reset to 30 or increase to 45 |
| TC-UP-06 | 升级后变更锁保留 | 升级成功并收到 webhook 后，直接再次调用升级或降级 API | 返回 409；`subscriptions.plan_change_requested_at` 仍非空，不能被 `subscription.update` 或 `subscription.paid` 清空 |
| TC-UP-07 | 升级后同步 Creem customer metadata | 升级完成后用 Creem API 查询该邮箱对应 customer | customer metadata 的 `plan_id=pro`、`credits=30`、`user_id` 保持原值 |
| TC-UP-08 | Confirm proration before upgrade | As a Starter user, click `Upgrade to Pro` | A confirmation dialog appears first and shows remaining days, the credit-balance rule, and states that Creem calculates the exact prorated difference. Cancel does not call the API; Confirm calls it. |
| TC-UP-09 | Upgrade preserves remaining balance | Test a Starter account upgrade with 10, 5, and 0 credits remaining before upgrade | 10 remaining becomes 30; 5 remaining becomes 25; 0 remaining becomes 20. In all cases subscriptions.credits_per_month=30 and later webhooks do not add more credits |

---

## 二、降级订阅

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-DN-01 | 降级仅记录待生效计划 | 使用 Pro 账号进入 `/pricing`，点击 `Downgrade to Starter` | 提示降级已排期；`users.plan` 仍为 pro；`users.credits` 仍为 30；`subscriptions.plan_id` 仍为 pro；`subscriptions.pending_plan=starter`；`plan_change_requested_at` 非空 |
| TC-DN-02 | 降级提示正确 | 查看 Pricing 和 Settings | Pricing 出现琥珀色提示，说明 Starter 将在下个周期生效；Settings 显示 `Your next plan is Starter` |
| TC-DN-03 | 降级后按钮禁用 | 再次进入 Pricing | 升降级按钮均不可点击；页面显示本周期已变更套餐的英文提示 |
| TC-DN-04 | 下周期生效 | 等待 Creem 进入下一计费周期并完成 `subscription.paid` | `users.plan=starter`；`users.credits=10`；`subscriptions.plan_id=starter`；`credits_per_month=10`；`pending_plan=null`；`plan_change_requested_at=null` |
| TC-DN-05 | 降级生效前 metadata 不提前变更 | 降级排期后、下一周期前查询 Creem customer metadata | metadata 仍保持当前 `pro/30`；只有下一周期 `subscription.paid` 后才会变为 `starter/10` |

---

## 三、取消订阅与恢复

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
| TC-CL-09 | Pricing 页反映排期取消状态 | 在 `scheduled_cancel` 状态进入 `/pricing` | 显示取消提示；非当前套餐按钮被禁用；提示用户到 Settings 恢复订阅后再变更套餐 |
| TC-CL-10 | 立即取消终态降回 Free | 通过 Creem Dashboard 或 API 立即取消一个订阅，触发 `subscription.canceled` | `subscriptions.status=canceled`；`users.plan=free`；`users.credits=0`；页面不再显示 Subscription 卡片 |
| TC-CL-11 | `scheduled_cancel` 不清零 | 收到 `subscription.scheduled_cancel` webhook 后检查 | `users.plan/credits` 保持不变；只有 `subscriptions.status=scheduled_cancel` 被更新 |

---

## 四、每周期只允许变更一次

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-LMT-01 | UI 二次变更被禁用 | 本周期已完成一次升级或降级后进入 Pricing | 升降级按钮禁用；显示本周期已变更套餐提示 |
| TC-LMT-02 | API 二次变更返回 409 | 直接调用 `/api/subscriptions/upgrade` 或 `/api/subscriptions/update` | 返回 409；提示 `You can only change your subscription plan once per billing cycle.`；数据库状态不变 |
| TC-LMT-03 | 并发请求只允许一个成功 | 在浏览器 Console 用 `Promise.all` 同时发出两个套餐变更请求 | 一个返回 200，另一个返回 409；数据库中只保留一次有效变更；不会调用两次 Creem |
| TC-LMT-04 | 新周期解除限制 | 上一周期已变更一次，并收到新的 `subscription.paid` | `plan_change_requested_at` 被清空；Pricing 页恢复可变更状态 |
| TC-LMT-05 | 取消和恢复不占变更次数 | 套餐变更一次后执行取消，再恢复 | 取消和恢复均被允许；恢复后 `plan_change_requested_at` 仍保留，用户仍不能再次变更套餐 |

---

## 五、新购买与 checkout 拦截

| ID | 场景 | 步骤 | 预期结果 |
| --- | --- | --- | --- |
| TC-CH-01 | 免费账号首次购买 Starter | 使用 `T-A` 在 `/pricing` 点击 `Get 10 Credits`，完成 Creem 测试付款 | `users.plan=starter`；`users.credits=10`；`subscriptions` 创建 Starter 记录；`transactions` 只新增一条 10 Credits 记录，不重复发两次 |
| TC-CH-02 | 已有订阅用户不能创建新 Checkout | 使用 `T-B` 直接调用 `/api/checkout` 创建 Pro checkout | 返回 409；不跳转 Creem；不创建新 checkout |
| TC-CH-03 | 付款跳转回来不重复加 Credits | 付款后等待 Dashboard 跳转，并多次刷新页面 | Credits 不重复增加；`verify-checkout` 对订阅产品返回 pending 或已处理；最终以 `subscription.paid` 为准 |
| TC-CH-04 | 首次购买不占用变更次数 | 免费账号首次购买 Starter 后，立即尝试升级 Pro | 首次购买后 `plan_change_requested_at` 为 null；升级应返回 200，而不是 409 |

---

## 六、Webhook 与数据库状态回归

| ID | 场景 | 预期结果 |
| --- | --- | --- |
| TC-WH-01 | `subscription.update` 升级 | `subscriptions.plan_id=pro`；`users.credits=remaining balance + 20, capped at 30`；不新增 transaction |
| TC-WH-02 | `subscription.update` 降级 | `subscriptions.plan_id` 仍为当前套餐；只写 `pending_plan`；`users.credits` 不变 |
| TC-WH-03 | `subscription.paid` 交易去重 | 不同计费周期各生成一条 transaction；重复投递同一支付事件不会重复加 Credits |
| TC-WH-04 | `subscription.scheduled_cancel` 状态同步 | `subscriptions.status=scheduled_cancel`；不清零 credits |
| TC-WH-05 | `subscription.expired` resets subscription and credits | `users.credits=0`; `users.plan=free`; `subscriptions.status=expired`; `subscriptions.plan_id=free`; `subscriptions.credits_per_month=NULL`; `pending_plan=null`; `plan_change_requested_at=null` |
| TC-WH-06 | 非法 webhook 签名 | `/api/webhooks/creem` 返回 401，且不修改数据库 |
| TC-WH-07 | `subscription.canceled` terminal reset | `subscriptions.status=canceled`; `subscriptions.plan_id=free`; `subscriptions.credits_per_month=NULL`; `pending_plan=null`; `plan_change_requested_at=null`; `users.plan=free`; `users.credits=0` |
| TC-WH-08 | `subscription.paid` 金额字段 | 若 Creem payload 不含 `amount`，`transactions.amount=0`；`credits` 仍按套餐写入 10 或 30 |
| TC-WH-09 | `subscription.update` 首次同步 | 初始订阅同步不设置 `plan_change_requested_at`，不占用每周期变更次数 |
| TC-WH-10 | `refund.created` 退款回归 | 写一条负数 transaction；用户 credits 按原交易 credits 扣回，且不低于 0 |

---

## 最终通过标准

- 所有 TC 执行结果符合预期。
- 升级、降级、取消、恢复的 UI 与 API 行为一致。
- `users.credits`、`subscriptions.pending_plan`、`plan_change_requested_at`、`status` 与 Creem 实际状态一致。
- `transactions` 无重复 Credits 记录。
- 同一个订阅周期内第二次套餐变更始终被拦截。
- 排期取消到期通过 `subscription.expired` 降回 Free；立即取消通过 `subscription.canceled` 降回 Free。
