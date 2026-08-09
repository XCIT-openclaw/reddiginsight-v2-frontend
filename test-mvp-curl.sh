#!/bin/bash
# ReddigInsight v2 MVP 完整功能验证测试 - curl 版本

BASE_URL="https://reddiginsight-v2.vercel.app"
RESULTS=()
PASSED=0
FAILED=0

log_result() {
    local test_name="$1"
    local passed="$2"
    local details="$3"
    
    if [ "$passed" = "true" ]; then
        echo "✅ $test_name: $details"
        RESULTS+=("✅ $test_name: $details")
        ((PASSED++))
    else
        echo "❌ $test_name: $details"
        RESULTS+=("❌ $test_name: $details")
        ((FAILED++))
    fi
}

echo "============================================================"
echo "ReddigInsight v2 MVP 完整功能验证测试 (curl 版本)"
echo "测试目标：$BASE_URL"
echo "测试时间：$(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"

# Test 1: 登录页面
echo ""
echo "============================================================"
echo "Test 1: 登录页面加载"
echo "============================================================"
content=$(curl -s "$BASE_URL/login")
has_welcome=$(echo "$content" | grep -qi "welcome back" && echo "true" || echo "false")
has_card=$(echo "$content" | grep -qi "data-slot=\"card\"" && echo "true" || echo "false")
has_loading=$(echo "$content" | grep -qi "loading\|checking session" && echo "true" || echo "false")

if [ "$has_welcome" = "true" ] && [ "$has_card" = "true" ]; then
    log_result "登录页面加载" "true" "欢迎语=✓, 卡片组件=✓, 加载状态=$has_loading"
else
    log_result "登录页面加载" "false" "欢迎语=$has_welcome, 卡片组件=$has_card"
fi

# Test 2: 注册页面
echo ""
echo "============================================================"
echo "Test 2: 注册页面加载"
echo "============================================================"
content=$(curl -s "$BASE_URL/signup")
has_email=$(echo "$content" | grep -qi "email" && echo "true" || echo "false")
has_password=$(echo "$content" | grep -qi "password" && echo "true" || echo "false")
has_confirm=$(echo "$content" | grep -qi "confirm" && echo "true" || echo "false")
has_signup=$(echo "$content" | grep -qi "sign up\|create account" && echo "true" || echo "false")

if [ "$has_email" = "true" ] && [ "$has_password" = "true" ] && [ "$has_confirm" = "true" ]; then
    log_result "注册页面加载" "true" "邮箱=$has_email, 密码=$has_password, 确认=$has_confirm"
else
    log_result "注册页面加载" "false" "邮箱=$has_email, 密码=$has_password, 确认=$has_confirm"
fi

# Test 3: 定价页面
echo ""
echo "============================================================"
echo "Test 3: 定价页面加载"
echo "============================================================"
content=$(curl -s "$BASE_URL/pricing")
has_pricing=$(echo "$content" | grep -qi "pricing\|credit\|plan" && echo "true" || echo "false")

if [ "$has_pricing" = "true" ]; then
    log_result "定价页面加载" "true" "价格信息=✓"
else
    log_result "定价页面加载" "false" "价格信息=✗"
fi

# Test 4: 首页
echo ""
echo "============================================================"
echo "Test 4: 首页加载"
echo "============================================================"
content=$(curl -s "$BASE_URL/")
has_title=$(echo "$content" | grep -qi "reddiginsight" && echo "true" || echo "false")
has_desc=$(echo "$content" | grep -qi "reddit.*analysis\|analysis.*reddit" && echo "true" || echo "false")

if [ "$has_title" = "true" ] && [ "$has_desc" = "true" ]; then
    log_result "首页加载" "true" "标题=✓, 描述=✓"
else
    log_result "首页加载" "false" "标题=$has_title, 描述=$has_desc"
fi

# Test 5: Dashboard 重定向
echo ""
echo "============================================================"
echo "Test 5: 未登录访问 Dashboard 重定向"
echo "============================================================"
final_url=$(curl -sL -o /dev/null -w "%{url_effective}" "$BASE_URL/dashboard")
is_login=$(echo "$final_url" | grep -q "login" && echo "true" || echo "false")
has_redirect=$(echo "$final_url" | grep -q "redirect" && echo "true" || echo "false")

if [ "$is_login" = "true" ] && [ "$has_redirect" = "true" ]; then
    log_result "未登录重定向" "true" "URL=$final_url"
else
    log_result "未登录重定向" "false" "URL=$final_url, 登录=$is_login, redirect=$has_redirect"
fi

# Test 6: Chat 重定向
echo ""
echo "============================================================"
echo "Test 6: 未登录访问 Chat 重定向"
echo "============================================================"
final_url=$(curl -sL -o /dev/null -w "%{url_effective}" "$BASE_URL/chat")
is_login=$(echo "$final_url" | grep -q "login" && echo "true" || echo "false")

if [ "$is_login" = "true" ]; then
    log_result "Chat 未登录重定向" "true" "URL=$final_url"
else
    log_result "Chat 未登录重定向" "false" "URL=$final_url"
fi

# Test 7: Reports 重定向
echo ""
echo "============================================================"
echo "Test 7: 未登录访问 Reports 重定向"
echo "============================================================"
final_url=$(curl -sL -o /dev/null -w "%{url_effective}" "$BASE_URL/reports")
is_login=$(echo "$final_url" | grep -q "login" && echo "true" || echo "false")

if [ "$is_login" = "true" ]; then
    log_result "Reports 未登录重定向" "true" "URL=$final_url"
else
    log_result "Reports 未登录重定向" "false" "URL=$final_url"
fi

# Test 8: API 端点
echo ""
echo "============================================================"
echo "Test 8: API 端点可用性"
echo "============================================================"
api_passed=0
api_total=3

status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/checkout")
echo "  /api/checkout: $status"
[ "$status" -lt 500 ] && ((api_passed++))

status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/reports")
echo "  /api/reports: $status"
[ "$status" -lt 500 ] && ((api_passed++))

status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/webhooks/creem")
echo "  /api/webhooks/creem: $status"
[ "$status" -lt 500 ] && ((api_passed++))

if [ "$api_passed" -ge 2 ]; then
    log_result "API 端点可用性" "true" "$api_passed/$api_total 端点可用"
else
    log_result "API 端点可用性" "false" "$api_passed/$api_total 端点可用"
fi

# Test 9: Dashboard 重定向验证（已登录用户）
echo ""
echo "============================================================"
echo "Test 9: Dashboard 重定向验证"
echo "============================================================"
# Dashboard 需要登录，验证重定向包含正确的 redirect 参数
final_url=$(curl -sL -o /dev/null -w "%{url_effective}" "$BASE_URL/dashboard")
has_dashboard_redirect=$(echo "$final_url" | grep -q "redirect=%2Fdashboard" && echo "true" || echo "false")

if [ "$has_dashboard_redirect" = "true" ]; then
    log_result "Dashboard 重定向验证" "true" "redirect 参数正确 ✓"
else
    log_result "Dashboard 重定向验证" "false" "URL=$final_url"
fi

# Test 10: Chat 重定向验证（已登录用户）
echo ""
echo "============================================================"
echo "Test 10: Chat 重定向验证"
echo "============================================================"
# Chat 需要登录，验证重定向包含正确的 redirect 参数
final_url=$(curl -sL -o /dev/null -w "%{url_effective}" "$BASE_URL/chat")
has_chat_redirect=$(echo "$final_url" | grep -q "redirect=%2Fchat" && echo "true" || echo "false")

if [ "$has_chat_redirect" = "true" ]; then
    log_result "Chat 重定向验证" "true" "redirect 参数正确 ✓"
else
    log_result "Chat 重定向验证" "false" "URL=$final_url"
fi

# Summary
echo ""
echo "============================================================"
echo "MVP 功能验证测试总结"
echo "============================================================"
TOTAL=$((PASSED + FAILED))
PASS_RATE=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc)

echo ""
echo "总测试数：$TOTAL"
echo "通过：$PASSED ✅"
echo "失败：$FAILED ❌"
echo "通过率：$PASS_RATE%"
echo ""
echo "详细结果:"
echo "------------------------------------------------------------"
for result in "${RESULTS[@]}"; do
    echo "$result"
done

echo ""
echo "测试完成时间：$(date '+%Y-%m-%d %H:%M:%S')"
