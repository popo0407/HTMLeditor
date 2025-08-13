"""
スクレイピングメインサービス

開発憲章の「業務ロジック層」として、スクレイピング処理全体を統括
- ブックマークレットロジックのPython実装
- 並列処理制御
- データ統合
"""

import asyncio
import time
import json
from typing import List, Dict, Any, Tuple
from playwright.async_api import Page
from app.services.browser_service import BrowserService
from app.models.scraping_schemas import (
    ScrapingRequest, ScrapingResponse, ScrapingResult, ScrapingMode, 
    StructuredData, UrlConfig, LoginCredentials
)
from app.config.settings import get_settings
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ScrapingService:
    """スクレイピングメインサービス"""
    
    def __init__(self):
        self.browser_service = BrowserService()
        self.settings = get_settings()
    
    async def execute_scraping(self, request: ScrapingRequest) -> ScrapingResponse:
        """スクレイピング処理の実行"""
        start_time = time.time()
        session_id = None
        
        try:
            # リクエスト形式の正規化（下位互換性サポート）
            url_configs = self._normalize_request(request)
            
            # ブラウザセッション作成
            session_id = await self.browser_service.create_session(request.credentials.dict())
            
            # 認証実行
            auth_success, auth_page = await self.browser_service.authenticate(session_id, request.credentials)
            if not auth_success:
                raise Exception("Authentication failed")
            
            # 各URLを順次処理（並列処理を無効化）
            results = []
            for url_config in url_configs:
                try:
                    logger.info(f"Processing URL: {url_config.url} with mode: {url_config.mode}")
                    
                    # 認証済みのページを使用（新しいページは作成しない）
                    page = auth_page
                    
                    # セッション情報を取得
                    session = self.browser_service.sessions.get(session_id)
                    
                    # スクレイピング実行
                    result = await self._scrape_single_url(page, url_config.url, url_config.mode, session)
                    
                    # ページを閉じない（認証済みページなので）
                    # await page.close()  # この行を削除
                    
                    results.append(result)
                    logger.info(f"Successfully processed: {url_config.url}")
                    
                except Exception as e:
                    logger.error(f"Failed to scrape {url_config.url}: {e}")
                    results.append(ScrapingResult(
                        url=url_config.url,
                        status="error",
                        mode=url_config.mode,
                        data=str(e),
                        error_message=str(e),
                        timestamp=datetime.utcnow().isoformat()
                    ))
            
            # 結果を処理
            combined_data = ""
            for result in results:
                if result.data:
                    combined_data += f"\n=== {result.url} ===\n{result.data}\n"
            
            # 構造化データの生成
            structured_data, formatted_output = self._create_structured_output(results)
            
            # レスポンス作成
            response = ScrapingResponse(
                session_id=session_id,
                results=results,
                combined_data=combined_data,
                structured_data=structured_data,
                formatted_output=formatted_output,
                total_processing_time=time.time() - start_time
            )
            
            logger.info(f"Scraping completed successfully. Session: {session_id}")
            return response
            
        except Exception as e:
            logger.error(f"Scraping failed: {e}")
            raise Exception(f"スクレイピング処理に失敗しました: {e}")
            
        finally:
            # セッションのクリーンアップ
            if session_id:
                try:
                    await self.browser_service.close_session(session_id)
                    logger.info(f"Session {session_id} closed")
                except Exception as e:
                    logger.error(f"Failed to close session {session_id}: {e}")
    
    def _normalize_request(self, request: ScrapingRequest) -> List[UrlConfig]:
        """リクエスト形式を正規化"""
        if request.url_configs and len(request.url_configs) > 0:
            return request.url_configs
        
        # 下位互換性：従来形式を新形式に変換
        if request.target_urls and request.mode:
            return [
                UrlConfig(url=url, mode=request.mode) 
                for url in request.target_urls
            ]
        
        raise ValueError("url_configs または target_urls + mode が必要です。url_configs が空の可能性があります。")
    
    def _create_structured_output(self, results: List[ScrapingResult]) -> Tuple[StructuredData, str]:
        """構造化されたデータとフォーマット済み出力を生成"""
        structured_data = StructuredData()
        
        for result in results:
            if result.status == "success" and result.data:
                if result.mode == ScrapingMode.TITLE_DATE_PARTICIPANT:
                    # Title, Date, Participantデータを解析
                    lines = result.data.strip().split('\n\n')
                    for line in lines:
                        if line.startswith('Title: '):
                            structured_data.title = line.replace('Title: ', '').strip()
                        elif line.startswith('date: '):
                            structured_data.date = line.replace('date: ', '').strip()
                        elif line.startswith('Participant: '):
                            structured_data.participant = line.replace('Participant: ', '').strip()
                
                elif result.mode == ScrapingMode.CHAT_ENTRIES:
                    # チャットエントリーデータをトランスクリプトとして使用
                    structured_data.transcript = result.data.strip()
        
        # 指定フォーマットでの出力生成
        formatted_parts = []
        
        if structured_data.title:
            formatted_parts.append(f"<タイトル>\n{structured_data.title}\n</タイトル>")
        
        if structured_data.date:
            formatted_parts.append(f"<日付>\n{structured_data.date}\n</日付>")
        
        if structured_data.participant:
            formatted_parts.append(f"<参加者>\n{structured_data.participant}\n</参加者>")
        
        if structured_data.transcript:
            formatted_parts.append(f"<トランスクリプト>\n{structured_data.transcript}\n</トランスクリプト>")
        
        formatted_output = '\n'.join(formatted_parts)
        
        return structured_data, formatted_output
    
    async def _scrape_single_url(self, page: Page, url: str, mode: ScrapingMode, session=None) -> ScrapingResult:
        """単一URLのスクレイピング実行"""
        start_time = time.time()
        
        try:
            logger.info(f"Starting to scrape: {url} with mode: {mode}")
            
            # ページナビゲーションの安定化
            try:
                # より安定したページ読み込み
                response = await page.goto(url, wait_until='networkidle', timeout=self.settings.NAVIGATION_TIMEOUT)
                
                # 認証済みセッションの場合、セッションストレージを設定
                if session and session.authenticated:
                    print("Session is authenticated, setting up session storage after navigation...")
                    logger.info("Session is authenticated, setting up session storage after navigation...")
                    
                    # セッションストレージにログイン状態を設定
                    await page.evaluate("sessionStorage.setItem('isLoggedIn', 'true')")
                    print("Session storage updated with login status")
                    logger.info("Session storage updated with login status")
                    
                    # ページリロードは避けて、直接スクレイピングを実行
                    print("Session storage set, proceeding with scraping...")
                    logger.info("Session storage set, proceeding with scraping...")
                
                # ページの完全な読み込みを待機
                await page.wait_for_load_state('domcontentloaded', timeout=self.settings.PAGE_LOAD_TIMEOUT)
                await page.wait_for_load_state('networkidle', timeout=self.settings.PAGE_LOAD_TIMEOUT)
                
                # 追加の安定化待機
                await asyncio.sleep(self.settings.INITIAL_WAIT)
                
                if response and response.status >= 400:
                    raise Exception(f"Page navigation failed with status: {response.status}")
                
                logger.info(f"Page navigation completed: {url}")
                
            except Exception as nav_error:
                logger.error(f"Navigation error for {url}: {nav_error}")
                # ナビゲーションエラーの場合は再試行
                try:
                    await page.reload(wait_until='domcontentloaded', timeout=self.settings.NAVIGATION_TIMEOUT)
                    await asyncio.sleep(self.settings.INITIAL_WAIT)
                    logger.info(f"Page reload successful for {url}")
                except Exception as reload_error:
                    logger.error(f"Page reload failed for {url}: {reload_error}")
                    raise nav_error
            
            # スクレイピングモードに応じた処理
            if mode == ScrapingMode.CHAT_ENTRIES:
                data = await self._scrape_chat_entries(page)
            elif mode == ScrapingMode.TITLE_DATE_PARTICIPANT:
                data = await self._scrape_title_date_participant(page, session)
            else:
                # デフォルトモード：エラー
                raise Exception(f"サポートされていないスクレイピングモードです: {mode}")
            
            processing_time = time.time() - start_time
            logger.info(f"Scraping completed for {url} in {processing_time:.2f}s")
            
            return ScrapingResult(
                url=url,
                status="success",
                mode=mode,
                data=data,
                processing_time=processing_time,
                timestamp=datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = f"Scraping failed for {url}: {str(e)}"
            logger.error(error_msg)
            
            return ScrapingResult(
                url=url,
                status="error",
                mode=mode,
                error_message=error_msg,
                processing_time=processing_time,
                timestamp=datetime.utcnow().isoformat()
            )
    
    async def _scrape_chat_entries(self, page: Page) -> str:
        """チャットエントリのスクレイピング（改善版）"""
        try:
            logger.info("Starting chat entries scraping with improved detection")
            
            # ページの完全な読み込みを待機
            logger.info("Waiting for page to fully load...")
            await page.wait_for_load_state("networkidle", timeout=self.settings.PAGE_LOAD_TIMEOUT)
            await page.wait_for_load_state("domcontentloaded", timeout=self.settings.PAGE_LOAD_TIMEOUT)
            
            # 追加の安定化待機
            await asyncio.sleep(2)
            
            # ページの基本情報をログ出力
            page_title = await page.title()
            logger.info(f"Page title: {page_title}")
            
            # ページのHTML構造を調査
            page_content = await page.content()
            logger.info(f"Page content length: {len(page_content)} characters")
            
            # スクロール可能なコンテナを検索（test_page1.htmlの実際の要素に合わせて最適化）
            scrollable_selectors = [
                # test_page1.htmlの実際の要素（最優先）
                '.scrollableContainer[data-is-scrollable="true"]',
                '[data-is-scrollable="true"]',
                '.scrollableContainer',
                # データ属性ベース
                '[data-scrollable="true"]',
                # クラス名ベース（より具体的）
                '.scrollable-container', '.scroll-container',
                '.chat-container', '.chat-messages', '.messages-container',
                '.conversation', '.chat-area', '.message-list',
                # 一般的なコンテンツエリア
                '.content', '.main-content', '.container', 'main', 'article',
                # フォールバック：body要素
                'body'
            ]
            
            scrollable_element = None
            used_selector = None
            
            # 各セレクターの結果を詳細にログ出力
            for selector in scrollable_selectors:
                try:
                    logger.info(f"Trying selector: {selector}")
                    elements = await page.query_selector_all(selector)
                    logger.info(f"Found {len(elements)} elements with selector: {selector}")
                    
                    for i, element in enumerate(elements):
                        try:
                            tag_name = await element.evaluate("el => el.tagName")
                            class_attr = await element.get_attribute('class')
                            id_attr = await element.get_attribute('id')
                            logger.info(f"  Element {i+1}: tag={tag_name}, class={class_attr}, id={id_attr}")
                        except Exception as e:
                            logger.warning(f"  Failed to get element info: {e}")
                    
                    if elements:
                        element = elements[0]  # 最初の要素を使用
                        
                        # 要素がスクロール可能かチェック（より詳細な検証）
                        is_scrollable = await page.evaluate("""
                            (element) => {
                                try {
                                    const style = window.getComputedStyle(element);
                                    const overflow = style.overflow || style.overflowY;
                                    const height = element.scrollHeight;
                                    const clientHeight = element.clientHeight;
                                    
                                    console.log('Element scroll check:', {
                                        tagName: element.tagName,
                                        className: element.className,
                                        overflow: overflow,
                                        scrollHeight: height,
                                        clientHeight: clientHeight,
                                        hasScrollableContent: height > clientHeight,
                                        hasScrollableStyle: (overflow === 'auto' || overflow === 'scroll'),
                                        hasScrollableAttribute: element.hasAttribute('data-is-scrollable') || 
                                                              element.hasAttribute('data-scrollable')
                                    });
                                    
                                    // スクロール可能な条件をより詳細にチェック
                                    const hasScrollableContent = height > clientHeight;
                                    const hasScrollableStyle = (overflow === 'auto' || overflow === 'scroll');
                                    const hasScrollableAttribute = element.hasAttribute('data-is-scrollable') || 
                                                                  element.hasAttribute('data-scrollable');
                                    
                                    // いずれかの条件を満たせばスクロール可能と判定
                                    return hasScrollableContent || hasScrollableStyle || hasScrollableAttribute;
                                } catch (e) {
                                    console.error('Scroll check error:', e);
                                    return false;
                                }
                            }
                        """, element)
                        
                        if is_scrollable:
                            scrollable_element = element
                            used_selector = selector
                            logger.info(f"Found scrollable element with selector: {selector}")
                            break
                        else:
                            logger.info(f"Element found but not scrollable: {selector}")
                    else:
                        logger.info(f"Selector not found: {selector}")
                        
                except Exception as e:
                    logger.warning(f"Error checking selector {selector}: {e}")
                    continue
            
            if not scrollable_element:
                logger.error("スクロール可能なコンテナが見つかりません")
                
                # ページ内のすべての要素を調査
                all_elements = await page.query_selector_all('*')
                logger.info(f"Total elements on page: {len(all_elements)}")
                
                # クラス属性を持つ要素を調査
                class_elements = []
                for elem in all_elements[:50]:  # 最初の50個の要素をチェック
                    try:
                        class_attr = await elem.get_attribute('class')
                        if class_attr:
                            tag_name = await elem.evaluate("el => el.tagName")
                            class_elements.append((tag_name, class_attr))
                    except:
                        continue
                
                logger.info("Elements with class attribute (first 20):")
                for tag, cls in class_elements[:20]:
                    logger.info(f"  {tag}: {cls}")
                
                raise Exception("スクロール可能なコンテナが見つかりません。チャットメッセージの抽出に必要な要素が存在しません。")
            
            logger.info(f"Using scrollable element: {used_selector}")
            
            # スクロール処理の改善
            all_messages = []
            seen_elements = set()
            scroll_attempts = 0
            max_scroll_attempts = self.settings.MAX_SCROLL_LOOPS
            
            while scroll_attempts < max_scroll_attempts:
                try:
                    # 現在のメッセージを収集
                    new_messages = await self._collect_chat_entries(page, "", seen_elements)
                    
                    if new_messages:
                        all_messages.append(new_messages)
                        logger.info(f"Collected messages in attempt {scroll_attempts + 1}")
                    
                    # スクロール実行
                    scroll_success = await page.evaluate("""
                        (element) => {
                            try {
                                const currentScroll = element.scrollTop;
                                const maxScroll = element.scrollHeight - element.clientHeight;
                                
                                console.log('Scroll attempt:', {
                                    currentScroll: currentScroll,
                                    maxScroll: maxScroll,
                                    scrollHeight: element.scrollHeight,
                                    clientHeight: element.clientHeight
                                });
                                
                                if (currentScroll >= maxScroll) {
                                    return false; // スクロール終了
                                }
                                
                                element.scrollTop = Math.min(currentScroll + 500, maxScroll);
                                return true; // スクロール成功
                            } catch (e) {
                                console.error('Scroll error:', e);
                                return false;
                            }
                        }
                    """, scrollable_element)
                    
                    if not scroll_success:
                        logger.info("Reached end of scrollable content")
                        break
                    
                    # スクロール後の待機
                    await asyncio.sleep(self.settings.SCROLL_DELAY / 1000)
                    scroll_attempts += 1
                    
                except Exception as scroll_error:
                    logger.warning(f"Scroll error in attempt {scroll_attempts + 1}: {scroll_error}")
                    break
            
            # 結果の統合
            if all_messages:
                combined_messages = "\n".join(all_messages)
                logger.info(f"Successfully collected {len(all_messages)} message batches")
                return combined_messages
            else:
                logger.warning("No messages collected")
                raise Exception("チャットメッセージが収集できませんでした。ページの構造を確認してください。")
                
        except Exception as e:
            logger.error(f"Chat entries scraping failed: {e}")
            raise Exception(f"チャットエントリのスクレイピングに失敗しました: {str(e)}")
    
    async def _collect_chat_entries(self, page: Page, existing_data: str, seen_elements: set) -> str:
        """チャットエントリーを収集（改善版）"""
        entries_data = ""
        
        # より柔軟なセレクター戦略でチャットエントリを検索
        entry_selectors = [
            '[class*="baseEntry-"]',  # 元のセレクター
            '.baseEntry-wrapper',      # test_page1.htmlの実際のクラス
            '.chat-entry', '.message-entry', '.entry-item',
            '[class*="entry"]', '[class*="message"]',
            '.ms-List-cell'           # test_page1.htmlの実際のクラス
        ]
        
        entries = []
        for selector in entry_selectors:
            try:
                found_entries = await page.query_selector_all(selector)
                if found_entries:
                    entries = found_entries
                    logger.info(f"Found {len(entries)} entries using selector: {selector}")
                    break
            except Exception as e:
                logger.debug(f"Selector {selector} failed: {e}")
                continue
        
        if not entries:
            logger.warning("No chat entries found with any selector")
            return ""
        
        for entry in entries:
            try:
                # 重複チェック
                entry_id = await entry.get_attribute('data-entry-id') or str(hash(await entry.inner_html()))
                if entry_id in seen_elements:
                    continue
                
                seen_elements.add(entry_id)
                
                # 発言者名を取得（より柔軟な方法）
                speaker = "（発言者不明）"
                
                # 1. aria-labelから取得を試行
                aria_label = await entry.get_attribute('aria-label')
                if aria_label:
                    import re
                    match = re.match(r'^(.+?)\s+\d', aria_label)
                    if match:
                        speaker = match.group(1).strip()
                
                # 2. 特定のクラスから取得を試行
                if speaker == "（発言者不明）":
                    speaker_selectors = [
                        '[class*="itemDisplayName-"]',
                        '.itemDisplayName-wrapper',
                        '.speaker', '.author', '.user-name'
                    ]
                    
                    for speaker_selector in speaker_selectors:
                        try:
                            speaker_element = await entry.query_selector(speaker_selector)
                            if speaker_element:
                                speaker_text = await speaker_element.text_content()
                                if speaker_text and speaker_text.strip():
                                    speaker = speaker_text.strip()
                                    break
                        except Exception as e:
                            logger.debug(f"Speaker selector {speaker_selector} failed: {e}")
                            continue
                
                # タイムスタンプを取得（より柔軟な方法）
                timestamp = ""
                timestamp_selectors = [
                    '[id^="Header-timestamp-"]',
                    '[class*="timestamp"]',
                    '.Header-timestamp-wrapper',
                    '.time', '.date-time'
                ]
                
                for ts_selector in timestamp_selectors:
                    try:
                        ts_element = await entry.query_selector(ts_selector)
                        if ts_element:
                            ts_text = await ts_element.text_content()
                            if ts_text and ts_text.strip():
                                timestamp = ts_text.strip()
                                break
                    except Exception as e:
                        logger.debug(f"Timestamp selector {ts_selector} failed: {e}")
                        continue
                
                # メッセージ内容を取得（より柔軟な方法）
                message_content = ""
                content_selectors = [
                    '[id^="sub-entry-"]',
                    '.sub-entry-content',
                    '[class*="content"]', '[class*="message"]',
                    '.message-text', '.content-text'
                ]
                
                for content_selector in content_selectors:
                    try:
                        content_element = await entry.query_selector(content_selector)
                        if content_element:
                            content_text = await content_element.text_content()
                            if content_text and content_text.strip():
                                message_content = content_text.strip()
                                break
                    except Exception as e:
                        logger.debug(f"Content selector {content_selector} failed: {e}")
                        continue
                
                # エントリデータを構築
                if message_content:
                    entry_data = f"{speaker}"
                    if timestamp:
                        entry_data += f" ({timestamp})"
                    entry_data += f": {message_content}\n"
                    
                    entries_data += entry_data
                    logger.debug(f"Collected entry: {entry_data.strip()}")
                
            except Exception as e:
                logger.warning(f"Failed to process entry: {e}")
                continue
        
        return entries_data
    
    async def _scrape_title_date_participant(self, page: Page, session=None) -> str:
        """タイトル、日付、参加者のスクレイピング（改善版）"""
        try:
            print("Starting Title/Date/Participant scraping with improved detection")
            logger.info("Starting Title/Date/Participant scraping with improved detection")
            

            
            # ページの基本情報をログ出力
            page_title = await page.title()
            print(f"Page title: {page_title}")
            logger.info(f"Page title: {page_title}")
            
            # ページのHTML構造を調査
            page_content = await page.content()
            print(f"Page content length: {len(page_content)} characters")
            logger.info(f"Page content length: {len(page_content)} characters")
            
            # test_page2.htmlの構造に特化したセレクター戦略
            target_classes = ['Title', 'date', 'Participant']
            collected_data = ""
            
            for class_name in target_classes:
                print(f"Looking for class: {class_name}")
                logger.info(f"Looking for class: {class_name}")
                
                # 直接的なクラス名で検索（test_page2.htmlの実際の構造）
                elements = await page.query_selector_all(f'.{class_name}')
                
                if elements:
                    print(f"Found {len(elements)} elements with class '{class_name}'")
                    logger.info(f"Found {len(elements)} elements with class '{class_name}'")
                    
                    for i, element in enumerate(elements):
                        try:
                            text_content = await element.text_content()
                            if text_content and text_content.strip():
                                collected_data += f"{class_name}: {text_content.strip()}\n\n"
                                print(f"Collected {class_name}: {text_content.strip()}")
                                logger.info(f"Collected {class_name}: {text_content.strip()}")
                            else:
                                print(f"Element with class '{class_name}' has no text content")
                                logger.warning(f"Element with class '{class_name}' has no text content")
                        except Exception as e:
                            print(f"Failed to get text from {class_name} element: {e}")
                            logger.warning(f"Failed to get text from {class_name} element: {e}")
                else:
                    print(f"No elements found with class '{class_name}'")
                    logger.warning(f"No elements found with class '{class_name}'")
                    
                    # 代替セレクターを試行
                    alternative_selectors = [
                        f'[class*="{class_name}"]',
                        f'[class*="{class_name.lower()}"]',
                        f'[class*="{class_name.upper()}"]',
                    ]
                    
                    for alt_selector in alternative_selectors:
                        try:
                            alt_elements = await page.query_selector_all(alt_selector)
                            if alt_elements:
                                print(f"Found {len(alt_elements)} elements with alternative selector: {alt_selector}")
                                logger.info(f"Found {len(alt_elements)} elements with alternative selector: {alt_selector}")
                                break
                        except Exception as e:
                            print(f"Alternative selector {alt_selector} failed: {e}")
                            logger.debug(f"Alternative selector {alt_selector} failed: {e}")
                            continue
            
            if not collected_data.strip():
                # より詳細なデバッグ情報を提供
                print("No data collected with any selector strategy")
                logger.error("No data collected with any selector strategy")
                
                # ページ内の利用可能なクラスを調査
                all_elements = await page.query_selector_all('*')
                class_elements = []
                
                print(f"Total elements on page: {len(all_elements)}")
                logger.info(f"Total elements on page: {len(all_elements)}")
                
                for elem in all_elements[:100]:  # 最初の100個の要素をチェック
                    try:
                        class_attr = await elem.get_attribute('class')
                        if class_attr:
                            tag_name = await elem.evaluate("el => el.tagName")
                            class_elements.append((tag_name, class_attr))
                    except:
                        continue
                
                print(f"Elements with class attribute: {len(class_elements)}")
                logger.info(f"Elements with class attribute: {len(class_elements)}")
                print("Available classes on page (first 30):")
                logger.info("Available classes on page (first 30):")
                
                # 重複を除去して表示
                unique_classes = set()
                for tag, cls in class_elements[:30]:
                    classes = cls.split()
                    for c in classes:
                        if c not in unique_classes:
                            unique_classes.add(c)
                            print(f"  {tag}: {c}")
                            logger.info(f"  {tag}: {c}")
                
                # 特定のクラス名を持つ要素を個別に検索
                for class_name in ['Title', 'date', 'Participant']:
                    title_elements = await page.query_selector_all(f'.{class_name}')
                    print(f"Elements with class '{class_name}': {len(title_elements)}")
                    logger.info(f"Elements with class '{class_name}': {len(title_elements)}")
                    if title_elements:
                        for elem in title_elements[:3]:
                            try:
                                text = await elem.text_content()
                                print(f"'{class_name}' element text: {text[:100]}...")
                                logger.info(f"'{class_name}' element text: {text[:100]}...")
                            except:
                                continue
                
                raise Exception("指定されたクラスを持つ要素が見つかりませんでした。ページの構造を確認してください。")
            
            print(f"Successfully collected data: {len(collected_data)} characters")
            logger.info(f"Successfully collected data: {len(collected_data)} characters")
            return collected_data
            
        except Exception as e:
            print(f"Title/Date/Participant scraping failed: {e}")
            logger.error(f"Title/Date/Participant scraping failed: {e}")
            raise
    

    
    async def shutdown(self):
        """サービスのシャットダウン"""
        await self.browser_service.shutdown()
