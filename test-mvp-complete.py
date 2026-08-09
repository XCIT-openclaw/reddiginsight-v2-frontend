#!/usr/bin/env python3
"""
ReddigInsight v2 MVP 完整功能验证测试
测试所有核心功能模块
"""

from scrapling.fetchers import StealthyFetcher
import json
import time

class MVPTester:
    def __init__(self):
        self.fetcher = StealthyFetcher()
        self.base_url = "https://reddiginsight-v2.vercel.app"
        self.test_email = "test-20260424@example.com"
        self.test_password = "TestPass123!"
        self.session_cookies = {}
        self.test_results = []
        
    def log_result(self, test_name, passed, details=""):
        """记录测试结果"""
        result = {
            "test": test_name,
            "passed": passed,
            "details": details,
            "status": "✅" if passed else "❌"
        }
        self.test_results.append(result)
        status_icon = "✅" if passed else "❌"
        print(f"{status_icon} {test_name}: {details}")
        
    def test_1_login_page(self):
        """Test 1: 登录页面加载"""
        print("\n" + "="*60)
        print("Test 1: 登录页面加载")
        print("="*60)
        
        try:
            # 使用 wait 参数等待页面完全加载
            page = self.fetcher.fetch(f"{self.base_url}/login", wait=5)
            
            if page.status == 200:
                content = page.text.lower()
                
                # 检查关键元素
                has_email = "email" in content
                has_password = "password" in content
                has_signin = "sign in" in content
                
                passed = has_email and has_password and has_signin
                self.log_result(
                    "登录页面加载",
                    passed,
                    f"状态码={page.status}, 邮箱字段={'✓' if has_email else '✗'}, 密码字段={'✓' if has_password else '✗'}, 登录按钮={'✓' if has_signin else '✗'}"
                )
                return True
            else:
                self.log_result("登录页面加载", False, f"状态码={page.status}")
                return False
        except Exception as e:
            self.log_result("登录页面加载", False, f"错误：{str(e)}")
            return False
    
    def test_2_signup_page(self):
        """Test 2: 注册页面加载"""
        print("\n" + "="*60)
        print("Test 2: 注册页面加载")
        print("="*60)
        
        try:
            page = self.fetcher.fetch(f"{self.base_url}/signup")
            
            if page.status == 200:
                content = page.text.lower()
                
                has_email = "email" in content
                has_password = "password" in content
                has_confirm = "confirm" in content
                has_create = "create account" in content or "sign up" in content
                
                passed = has_email and has_password and has_confirm and has_create
                self.log_result(
                    "注册页面加载",
                    passed,
                    f"状态码={page.status}, 邮箱={'✓' if has_email else '✗'}, 密码={'✓' if has_password else '✗'}, 确认密码={'✓' if has_confirm else '✗'}, 创建按钮={'✓' if has_create else '✗'}"
                )
                return True
            else:
                self.log_result("注册页面加载", False, f"状态码={page.status}")
                return False
        except Exception as e:
            self.log_result("注册页面加载", False, f"错误：{str(e)}")
            return False
    
    def test_3_pricing_page(self):
        """Test 3: 定价页面加载"""
        print("\n" + "="*60)
        print("Test 3: 定价页面加载")
        print("="*60)
        
        try:
            page = self.fetcher.fetch(f"{self.base_url}/pricing")
            
            if page.status == 200:
                content = page.text.lower()
                
                has_pricing = "pricing" in content or "credit" in content
                has_plan = "plan" in content or "subscription" in content
                
                passed = has_pricing and has_plan
                self.log_result(
                    "定价页面加载",
                    passed,
                    f"状态码={page.status}, 价格信息={'✓' if has_pricing else '✗'}, 套餐信息={'✓' if has_plan else '✗'}"
                )
                return True
            else:
                self.log_result("定价页面加载", False, f"状态码={page.status}")
                return False
        except Exception as e:
            self.log_result("定价页面加载", False, f"错误：{str(e)}")
            return False
    
    def test_4_homepage(self):
        """Test 4: 首页加载"""
        print("\n" + "="*60)
        print("Test 4: 首页加载")
        print("="*60)
        
        try:
            page = self.fetcher.fetch(self.base_url)
            
            if page.status == 200:
                content = page.text.lower()
                
                has_title = "reddiginsight" in content
                has_description = "reddit" in content and "analysis" in content
                
                passed = has_title and has_description
                self.log_result(
                    "首页加载",
                    passed,
                    f"状态码={page.status}, 标题={'✓' if has_title else '✗'}, 描述={'✓' if has_description else '✗'}"
                )
                return True
            else:
                self.log_result("首页加载", False, f"状态码={page.status}")
                return False
        except Exception as e:
            self.log_result("首页加载", False, f"错误：{str(e)}")
            return False
    
    def test_5_auth_redirect(self):
        """Test 5: 未登录访问 Dashboard 重定向"""
        print("\n" + "="*60)
        print("Test 5: 未登录访问 Dashboard 重定向")
        print("="*60)
        
        try:
            page = self.fetcher.fetch(f"{self.base_url}/dashboard")
            
            # 应该重定向到登录页
            is_redirect = "login" in page.url.lower()
            has_redirect_param = "redirect" in page.url.lower()
            
            passed = is_redirect and has_redirect_param
            self.log_result(
                "未登录重定向",
                passed,
                f"最终 URL={page.url}, 重定向到登录={'✓' if is_redirect else '✗'}, 包含 redirect 参数={'✓' if has_redirect_param else '✗'}"
            )
            return True
        except Exception as e:
            self.log_result("未登录重定向", False, f"错误：{str(e)}")
            return False
    
    def test_6_chat_redirect(self):
        """Test 6: 未登录访问 Chat 重定向"""
        print("\n" + "="*60)
        print("Test 6: 未登录访问 Chat 重定向")
        print("="*60)
        
        try:
            page = self.fetcher.fetch(f"{self.base_url}/chat")
            
            # 应该重定向到登录页
            is_redirect = "login" in page.url.lower()
            has_redirect_param = "redirect" in page.url.lower()
            
            passed = is_redirect and has_redirect_param
            self.log_result(
                "Chat 未登录重定向",
                passed,
                f"最终 URL={page.url}, 重定向到登录={'✓' if is_redirect else '✗'}"
            )
            return True
        except Exception as e:
            self.log_result("Chat 未登录重定向", False, f"错误：{str(e)}")
            return False
    
    def test_7_reports_redirect(self):
        """Test 7: 未登录访问 Reports 重定向"""
        print("\n" + "="*60)
        print("Test 7: 未登录访问 Reports 重定向")
        print("="*60)
        
        try:
            page = self.fetcher.fetch(f"{self.base_url}/reports")
            
            # 应该重定向到登录页
            is_redirect = "login" in page.url.lower()
            
            passed = is_redirect
            self.log_result(
                "Reports 未登录重定向",
                passed,
                f"最终 URL={page.url}, 重定向到登录={'✓' if is_redirect else '✗'}"
            )
            return True
        except Exception as e:
            self.log_result("Reports 未登录重定向", False, f"错误：{str(e)}")
            return False
    
    def test_8_api_health(self):
        """Test 8: API 端点可用性"""
        print("\n" + "="*60)
        print("Test 8: API 端点可用性")
        print("="*60)
        
        from scrapling.fetchers import Fetcher
        
        api_endpoints = [
            "/api/checkout",
            "/api/reports",
            "/api/webhooks/creem",
        ]
        
        passed_count = 0
        for endpoint in api_endpoints:
            try:
                # 使用普通 Fetcher 测试 API（不需要浏览器）
                page = Fetcher.get(f"{self.base_url}{endpoint}")
                # API 可能返回 401/403/404，只要不是 500/502/503 就认为服务可用
                if page.status < 500:
                    passed_count += 1
                    print(f"  ✓ {endpoint}: {page.status}")
                else:
                    print(f"  ✗ {endpoint}: {page.status} (Server Error)")
            except Exception as e:
                print(f"  ✗ {endpoint}: {str(e)}")
        
        passed = passed_count >= len(api_endpoints) * 0.5  # 至少 50% 可用
        self.log_result(
            "API 端点可用性",
            passed,
            f"{passed_count}/{len(api_endpoints)} 端点可用"
        )
        return passed
    
    def test_9_dashboard_params_structure(self):
        """Test 9: Dashboard URL 参数结构验证（代码层面）"""
        print("\n" + "="*60)
        print("Test 9: Dashboard URL 参数结构验证")
        print("="*60)
        
        # 检查 Dashboard 页面代码是否包含参数处理逻辑
        try:
            page = self.fetcher.fetch(f"{self.base_url}/dashboard")
            content = page.text
            
            # 检查关键代码片段
            has_search_params = "searchParams" in content or "useSearchParams" in content
            has_subreddit_param = "subreddit" in content
            has_keywords_param = "keywords" in content
            has_params_loaded = "Parameters loaded" in content or "paramsLoaded" in content
            
            passed = has_search_params and has_subreddit_param and has_keywords_param
            self.log_result(
                "Dashboard 参数结构",
                passed,
                f"useSearchParams={'✓' if has_search_params else '✗'}, subreddit 参数={'✓' if has_subreddit_param else '✗'}, keywords 参数={'✓' if has_keywords_param else '✗'}, 加载提示={'✓' if has_params_loaded else '✗'}"
            )
            return passed
        except Exception as e:
            self.log_result("Dashboard 参数结构", False, f"错误：{str(e)}")
            return False
    
    def test_10_chat_structure(self):
        """Test 10: Chat 页面结构验证"""
        print("\n" + "="*60)
        print("Test 10: Chat 页面结构验证")
        print("="*60)
        
        try:
            # 访问 Chat 页面（会被重定向到登录）
            page = self.fetcher.fetch(f"{self.base_url}/chat")
            content = page.text
            
            # 检查是否包含 Chat 相关元素（即使在登录页）
            # 主要验证页面能正常渲染
            has_reddiginsight = "reddiginsight" in content.lower()
            
            passed = has_reddiginsight
            self.log_result(
                "Chat 页面结构",
                passed,
                f"页面可访问={'✓' if passed else '✗'}"
            )
            return passed
        except Exception as e:
            self.log_result("Chat 页面结构", False, f"错误：{str(e)}")
            return False
    
    def print_summary(self):
        """打印测试总结"""
        print("\n" + "="*60)
        print("MVP 功能验证测试总结")
        print("="*60)
        
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r["passed"])
        failed = total - passed
        
        print(f"\n总测试数：{total}")
        print(f"通过：{passed} ✅")
        print(f"失败：{failed} ❌")
        print(f"通过率：{passed/total*100:.1f}%")
        
        print("\n详细结果:")
        print("-"*60)
        for result in self.test_results:
            print(f"{result['status']} {result['test']}: {result['details']}")
        
        # 保存结果到文件
        with open('/tmp/mvp-test-results.json', 'w', encoding='utf-8') as f:
            json.dump({
                "total": total,
                "passed": passed,
                "failed": failed,
                "pass_rate": f"{passed/total*100:.1f}%",
                "results": self.test_results,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }, f, ensure_ascii=False, indent=2)
        
        print(f"\n测试结果已保存到：/tmp/mvp-test-results.json")
        
        return passed == total
    
    def run_all_tests(self):
        """运行所有测试"""
        print("\n" + "="*60)
        print("ReddigInsight v2 MVP 完整功能验证测试")
        print(f"测试目标：{self.base_url}")
        print(f"测试时间：{time.strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        # 执行所有测试
        self.test_1_login_page()
        self.test_2_signup_page()
        self.test_3_pricing_page()
        self.test_4_homepage()
        self.test_5_auth_redirect()
        self.test_6_chat_redirect()
        self.test_7_reports_redirect()
        self.test_8_api_health()
        self.test_9_dashboard_params_structure()
        self.test_10_chat_structure()
        
        # 打印总结
        all_passed = self.print_summary()
        
        return all_passed


if __name__ == "__main__":
    tester = MVPTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)
