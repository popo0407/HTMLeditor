"""
ブラウザ制御サービス

開発憲章のSRP原則に従い、Playwrightブラウザの制御に特化したサービス
- ブラウザインスタンスの生成・管理
- ページナビゲーション
- 認証処理
"""

import asyncio
import uuid
from typing import Dict, Optional, Any
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from app.config.settings import get_settings
from app.models.scraping_schemas import LoginCredentials
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class BrowserSession:
    """ブラウザセッション管理クラス"""
    
    def __init__(self, id: str, browser: Browser, context: BrowserContext, authenticated: bool, created_at: datetime):
        self.id = id
        self.browser = browser
        self.context = context
        self.authenticated = authenticated
        self.created_at = created_at

    
    async def close(self):
        """セッションを閉じる"""
        try:
            await self.context.close()
            await self.browser.close()
            logger.info(f"Browser session {self.id} closed")
        except Exception as e:
            logger.error(f"Error closing browser session {self.id}: {e}")


class BrowserService:
    """ブラウザ制御サービス"""
    
    def __init__(self):
        self.settings = get_settings()
        self.sessions: Dict[str, BrowserSession] = {}
        self.playwright = None
        
    async def initialize(self):
        """Playwrightを初期化"""
        if not self.playwright:
            self.playwright = await async_playwright().start()
            logger.info("Playwright initialized")
    
    async def create_session(self, credentials: dict) -> str:
        """新しいブラウザセッションを作成"""
        logger.info(f"Launching browser headless={self.settings.HEADLESS}")
        try:
            if not self.playwright:
                logger.info("Initializing Playwright...")
                self.playwright = await async_playwright().start()
                logger.info("Playwright initialized successfully")

            # ブラウザ設定を取得
            launch_config = {
                "headless": self.settings.HEADLESS,
                "slow_mo": self.settings.SLOW_MO,
                "devtools": self.settings.DEVTOOLS,
                "args": self.settings.get_browser_config()["args"]
            }
            
            logger.info(f"Launching browser with config: {launch_config}")
            browser = await self.playwright.chromium.launch(**launch_config)
            
            # コンテキスト作成時の設定を調整
            context_config = {
                "viewport": {"width": 1280, "height": 720},
                "ignore_https_errors": True,
                "accept_downloads": False,
                "java_script_enabled": True,
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            logger.info(f"Creating browser context with config: {context_config}")
            context = await browser.new_context(**context_config)
            
            # セッションIDを生成
            session_id = str(uuid.uuid4())
            
            # セッション情報を保存
            self.sessions[session_id] = BrowserSession(
                id=session_id,
                browser=browser,
                context=context,
                authenticated=False,
                created_at=datetime.utcnow()
            )
            
            logger.info(f"Session {session_id} created successfully")
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to create session: {e}")
            raise Exception(f"セッション作成に失敗しました: {e}")
    
    async def authenticate(self, session_id: str, credentials: LoginCredentials) -> tuple[bool, Page]:
        """フォーム認証を実行"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        try:
            print(f"Starting authentication for session {session_id}")
            logger.info(f"Starting authentication for session {session_id}")
            
            page = await session.context.new_page()
            
            # ログインページに移動
            print(f"Navigating to login page: {credentials.login_url}")
            logger.info(f"Navigating to login page: {credentials.login_url}")
            
            await page.goto(credentials.login_url, timeout=self.settings.PAGE_LOAD_TIMEOUT)
            
            # ページのタイトルを確認
            page_title = await page.title()
            print(f"Login page title: {page_title}")
            logger.info(f"Login page title: {page_title}")
            
            # 一般的なフォーム要素を検索してログイン
            # ユーザー名フィールド
            username_selectors = [
                'input[name="username"]',
                'input[name="email"]',
                'input[type="email"]',
                'input[id*="user"]',
                'input[id*="login"]'
            ]
            
            password_selectors = [
                'input[name="password"]',
                'input[type="password"]',
                'input[id*="pass"]'
            ]
            
            # ユーザー名入力
            print("Looking for username field...")
            logger.info("Looking for username field...")
            
            for selector in username_selectors:
                try:
                    print(f"Trying username selector: {selector}")
                    logger.info(f"Trying username selector: {selector}")
                    
                    await page.wait_for_selector(selector, timeout=self.settings.ELEMENT_WAIT_TIMEOUT)
                    await page.fill(selector, credentials.username)
                    print(f"Username entered using selector: {selector}")
                    logger.info(f"Username entered using selector: {selector}")
                    break
                except Exception as e:
                    print(f"Username selector {selector} failed: {e}")
                    logger.debug(f"Username selector {selector} failed: {e}")
                    continue
            else:
                print("Username field not found with any selector")
                logger.error("Username field not found")
                raise Exception("Username field not found")
            
            # パスワード入力
            print("Looking for password field...")
            logger.info("Looking for password field...")
            
            for selector in password_selectors:
                try:
                    print(f"Trying password selector: {selector}")
                    logger.info(f"Trying password selector: {selector}")
                    
                    await page.wait_for_selector(selector, timeout=self.settings.ELEMENT_WAIT_TIMEOUT)
                    await page.fill(selector, credentials.password)
                    print(f"Password entered using selector: {selector}")
                    logger.info(f"Password entered using selector: {selector}")
                    break
                except Exception as e:
                    print(f"Password selector {selector} failed: {e}")
                    logger.debug(f"Password selector {selector} failed: {e}")
                    continue
            else:
                print("Password field not found with any selector")
                logger.error("Password field not found")
                raise Exception("Password field not found")
            
            # ログインボタンをクリック
            print("Looking for login button...")
            logger.info("Looking for login button...")
            
            submit_selectors = [
                'input[type="submit"]',
                'button[type="submit"]',
                'button:has-text("ログイン")',
                'button:has-text("Login")',
                'button:has-text("サインイン")',
                'input[value*="ログイン"]'
            ]
            
            for selector in submit_selectors:
                try:
                    print(f"Trying submit selector: {selector}")
                    logger.info(f"Trying submit selector: {selector}")
                    
                    await page.click(selector)
                    print(f"Login button clicked using selector: {selector}")
                    logger.info(f"Login button clicked using selector: {selector}")
                    break
                except Exception as e:
                    print(f"Submit selector {selector} failed: {e}")
                    logger.debug(f"Submit selector {selector} failed: {e}")
                    continue
            else:
                # Enterキーでログインを試行
                print("No submit button found, trying Enter key")
                logger.info("No submit button found, trying Enter key")
                await page.keyboard.press("Enter")
            
            # ページの変化を待機（ログイン成功の判定）
            print("Waiting for page to load after login...")
            logger.info("Waiting for page to load after login...")
            
            await page.wait_for_load_state("networkidle", timeout=self.settings.PAGE_LOAD_TIMEOUT)
            
            # ログイン後のページタイトルを確認
            new_page_title = await page.title()
            print(f"Page title after login: {new_page_title}")
            logger.info(f"Page title after login: {new_page_title}")
            
            # エラーメッセージがないかチェック（存在チェックのみ、タイムアウトなし）
            print("Checking for error messages...")
            logger.info("Checking for error messages...")
            
            error_indicators = [
                'text="ログインに失敗"',
                'text="パスワードが間違っています"',
                'text="ユーザー名が見つかりません"',
                '.error',
                '.alert-error'
            ]
            
            for error_selector in error_indicators:
                try:
                    # タイムアウトなしで即座にチェック
                    error_element = await page.query_selector(error_selector)
                    if error_element:
                        error_text = await error_element.text_content()
                        print(f"Login error detected: {error_text}")
                        logger.warning(f"Login error detected: {error_text}")
                        return False, page # 認証失敗時はページオブジェクトを返す
                    else:
                        print(f"Error selector {error_selector} not found (login successful)")
                        logger.debug(f"Error selector {error_selector} not found (login successful)")
                except Exception as e:
                    # エラーが発生した場合も正常として扱う
                    print(f"Error checking selector {error_selector}: {e}")
                    logger.debug(f"Error checking selector {error_selector}: {e}")
                    continue
            
            session.authenticated = True
            
            # 認証成功後、ターゲットページに移動してセッションを確立
            print(f"Authentication successful, now navigating to target page...")
            logger.info(f"Authentication successful, now navigating to target page...")
            
            # セッションストレージにログイン状態を設定
            await page.evaluate("sessionStorage.setItem('isLoggedIn', 'true')")
            print("Session storage updated with login status")
            logger.info("Session storage updated with login status")
            
            # 認証処理ではページを閉じない（スクレイピング処理でそのまま使用する）
            # await page.close()  # この行を削除
            print("Authentication page kept open for scraping")
            logger.info("Authentication page kept open for scraping")
            
            print(f"Authentication successful for session {session_id}")
            logger.info(f"Authentication successful for session {session_id}")
            return True, page
            
        except Exception as e:
            print(f"Authentication failed for session {session_id}: {e}")
            logger.error(f"Authentication failed for session {session_id}: {e}")
            return False, None # 認証失敗時はページオブジェクトを返さない
    
    async def get_page(self, session_id: str) -> Page:
        """セッションから新しいページを取得"""
        try:
            if session_id not in self.sessions:
                raise Exception(f"Session {session_id} not found")
            
            session = self.sessions[session_id]
            

            
            # セッションの有効性チェック（より安全な方法）
            try:
                if not session.context:
                    raise Exception("Context is None")
                
                # 新しいページを作成してコンテキストの状態をテスト
                test_page = await session.context.new_page()
                await test_page.close()
                
            except Exception as context_error:
                logger.warning(f"Session {session_id} context is invalid: {context_error}")
                await self._recreate_session_context(session_id)
                session = self.sessions[session_id]
            
            # 新しいページを作成
            page = await session.context.new_page()
            
            # ページの安定性設定
            await page.set_viewport_size({"width": 1280, "height": 720})
            
            # エラーハンドリングの強化
            page.on("pageerror", lambda err: logger.warning(f"Page error: {err}"))
            page.on("crash", lambda: logger.error("Page crashed"))
            
            # タイムアウト設定
            page.set_default_timeout(self.settings.PAGE_LOAD_TIMEOUT)
            page.set_default_navigation_timeout(self.settings.NAVIGATION_TIMEOUT)
            
            logger.info(f"New page created for session {session_id}")
            return page
            
        except Exception as e:
            logger.error(f"Failed to get page for session {session_id}: {e}")
            # セッション再作成を試行
            try:
                await self._recreate_session_context(session_id)
                session = self.sessions[session_id]
                page = await session.context.new_page()
                logger.info(f"Page created after session recreation for {session_id}")
                return page
            except Exception as recreate_error:
                logger.error(f"Failed to recreate session {session_id}: {recreate_error}")
                raise Exception(f"ページ取得に失敗しました: {str(e)}")
    
    async def _recreate_session_context(self, session_id: str):
        """セッションコンテキストを再作成"""
        try:
            if session_id not in self.sessions:
                return
            
            session = self.sessions[session_id]
            
            # 既存のコンテキストを閉じる（より安全な方法）
            if session.context:
                try:
                    await session.context.close()
                except Exception as e:
                    logger.warning(f"Error closing old context: {e}")
            
            # 新しいコンテキストを作成
            context_config = {
                "viewport": {"width": 1280, "height": 720},
                "ignore_https_errors": True,
                "accept_downloads": False,
                "java_script_enabled": True,
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
            
            new_context = await session.browser.new_context(**context_config)
            
            # セッション情報を更新
            session.context = new_context
            session.authenticated = False  # 認証状態をリセット
            
            logger.info(f"Session context recreated for {session_id}")
            
        except Exception as e:
            logger.error(f"Failed to recreate session context for {session_id}: {e}")
            raise
    
    async def close_session(self, session_id: str):
        """セッションを閉じる"""
        session = self.sessions.pop(session_id, None)
        if session:
            try:
                await session.close()
            except Exception as e:
                logger.error(f"Error closing session {session_id}: {e}")
    
    async def cleanup_expired_sessions(self):
        """期限切れセッションをクリーンアップ"""
        current_time = datetime.utcnow()
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            if (current_time - session.created_at).total_seconds() > self.settings.SESSION_TIMEOUT:
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            await self.close_session(session_id)
            logger.info(f"Expired session {session_id} cleaned up")
    
    async def shutdown(self):
        """全セッションを閉じてPlaywrightをシャットダウン"""
        for session_id in list(self.sessions.keys()):
            await self.close_session(session_id)
        
        if self.playwright:
            await self.playwright.stop()
            self.playwright = None
            logger.info("Playwright shutdown completed")
