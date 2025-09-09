// 基本的なTinyMCE設定
export const tinymceConfig: any = {
  // GPLライセンスを使用（オープンソース）
  license_key: 'gpl',
  // public/tinymceディレクトリを使用（APIキー不要）
  base_url: '/tinymce',
  suffix: '.min',
  height: 500,
  menubar: true,
  plugins: [
    "advlist",
    "autolink", 
    "lists",
    "link",
    "image",
    "charmap",
    "preview",
    "anchor",
    "searchreplace",
    "visualblocks",
    "code",
    "fullscreen",
    "insertdatetime",
    "media",
    "table",
    "help",
    "wordcount",
  ],
  toolbar: [
    "undo redo | formatselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify",
    "bullist numlist outdent indent | link image | table | searchreplace | code",
    "heading-large heading-medium heading-small heading-normal | separator | important action-item normal-text",
  ],
  branding: false,
  promotion: false,
  // 画像の貼り付けとbase64変換設定
  paste_data_images: true,
  automatic_uploads: false,
  images_upload_handler: (blobInfo: any, success: (url: string) => void, failure: (err: string) => void) => {
    // 画像をbase64として埋め込む
    const reader = new FileReader();
    reader.onload = function () {
      success(reader.result as string);
    };
    reader.onerror = function () {
      failure('画像の読み込みに失敗しました');
    };
    reader.readAsDataURL(blobInfo.blob());
  },
  // 共通CSSファイルを使用（重複したcontent_styleは削除）
  content_css: [
    '/editor-styles.css' // ビルド時にpdf.cssからコピーされる
  ],
  // 最小限のcontent_styleのみ（TinyMCE固有の調整）
  content_style: `
    /* TinyMCE固有の調整のみ */
    table { border-collapse: collapse; width: 100%; margin: 16px 0 !important; }
    table td, table th { border: 1px solid #000 !important; padding: 8px !important; }
    table th { background-color: #f8f9fa !important; font-weight: bold !important; }
    table[style*="border"] td, table[style*="border"] th { border: 1px solid #000 !important; }
    .custom-table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    .custom-table td, .custom-table th { border: 1px solid #000; padding: 8px; }
    .custom-table th { background-color: #f8f9fa; font-weight: bold; }
  `,
  setup: function (editor: any) {
    
    // セパレーターを登録
    editor.ui.registry.addButton('separator', {
      text: '|',
      tooltip: '',
      onAction: function () {
        // セパレーターは何もしない
      }
    });

    // カスタムショートカットキー: Ctrl+Shift+H で検索・置換
    editor.addShortcut('ctrl+shift+h', 'Search and Replace', function() {
      editor.execCommand('mceSearchReplace');
    });
    
    // 見出し大ボタン
    editor.ui.registry.addButton('heading-large', {
      text: '見出し大',
      tooltip: '見出し大（H1）',
      onAction: function () {
        editor.formatter.remove('h2');
        editor.formatter.remove('h3');
        editor.formatter.remove('p');
        editor.formatter.apply('h1');
      }
    });
    
    // 見出し中ボタン
    editor.ui.registry.addButton('heading-medium', {
      text: '見出し中',
      tooltip: '見出し中（H2）',
      onAction: function () {
        editor.formatter.remove('h1');
        editor.formatter.remove('h3');
        editor.formatter.remove('p');
        editor.formatter.apply('h2');
      }
    });
    
    // 見出し小ボタン
    editor.ui.registry.addButton('heading-small', {
      text: '見出し小',
      tooltip: '見出し小（H3）',
      onAction: function () {
        editor.formatter.remove('h1');
        editor.formatter.remove('h2');
        editor.formatter.remove('p');
        editor.formatter.apply('h3');
      }
    });
    
    // 標準ボタン
    editor.ui.registry.addButton('heading-normal', {
      text: '標準',
      tooltip: '標準テキスト（P）',
      onAction: function () {
        editor.formatter.remove('h1');
        editor.formatter.remove('h2');
        editor.formatter.remove('h3');
        editor.formatter.apply('p');
      }
    });
    
    // 重要ボタン
    editor.ui.registry.addButton('important', {
      text: '重要',
      tooltip: '重要（黄色背景）',
      onAction: function () {
        const selection = editor.selection;
        const node = selection.getNode();
        
        // ul要素を探す
        let ulElement = node;
        while (ulElement && ulElement !== editor.getBody()) {
          if (ulElement.tagName === 'UL') {
            break;
          }
          ulElement = ulElement.parentNode;
        }
        
        // table要素を探す
        let tableElement = node;
        while (tableElement && tableElement !== editor.getBody()) {
          if (tableElement.tagName === 'TABLE') {
            break;
          }
          tableElement = tableElement.parentNode;
        }
        
        if (ulElement && ulElement.tagName === 'UL') {
          // ul全体に強調クラスを適用（インデントを保持）
          editor.dom.removeClass(ulElement, 'action-item');
          editor.dom.addClass(ulElement, 'important');
        } else if (tableElement && tableElement.tagName === 'TABLE') {
          // table全体に強調クラスを適用
          editor.dom.removeClass(tableElement, 'action-item');
          editor.dom.addClass(tableElement, 'important');
        } else {
          // ul/table以外の場合は従来の動作
          const content = selection.getContent();
          if (content) {
            const wrappedContent = `<div class="important">${content}</div>`;
            selection.setContent(wrappedContent);
          } else {
            editor.dom.removeClass(node, 'action-item');
            editor.dom.toggleClass(node, 'important');
          }
        }
      }
    });
    
    // アクションアイテムボタン
    editor.ui.registry.addButton('action-item', {
      text: 'アクション',
      tooltip: 'アクションアイテム（緑色背景）',
      onAction: function () {
        const selection = editor.selection;
        const node = selection.getNode();
        
        // ul要素を探す
        let ulElement = node;
        while (ulElement && ulElement !== editor.getBody()) {
          if (ulElement.tagName === 'UL') {
            break;
          }
          ulElement = ulElement.parentNode;
        }
        
        // table要素を探す
        let tableElement = node;
        while (tableElement && tableElement !== editor.getBody()) {
          if (tableElement.tagName === 'TABLE') {
            break;
          }
          tableElement = tableElement.parentNode;
        }
        
        if (ulElement && ulElement.tagName === 'UL') {
          // ul全体に強調クラスを適用（インデントを保持）
          editor.dom.removeClass(ulElement, 'important');
          editor.dom.addClass(ulElement, 'action-item');
        } else if (tableElement && tableElement.tagName === 'TABLE') {
          // table全体に強調クラスを適用
          editor.dom.removeClass(tableElement, 'important');
          editor.dom.addClass(tableElement, 'action-item');
        } else {
          // ul/table以外の場合は従来の動作
          const content = selection.getContent();
          if (content) {
            const wrappedContent = `<div class="action-item">${content}</div>`;
            selection.setContent(wrappedContent);
          } else {
            editor.dom.removeClass(node, 'important');
            editor.dom.toggleClass(node, 'action-item');
          }
        }
      }
    });
    
    // 標準テキストボタン
    editor.ui.registry.addButton('normal-text', {
      text: '標準',
      tooltip: '標準テキスト（強調なし）',
      onAction: function () {
        const selection = editor.selection;
        const node = selection.getNode();
        
        // ul要素を探す
        let ulElement = node;
        while (ulElement && ulElement !== editor.getBody()) {
          if (ulElement.tagName === 'UL') {
            break;
          }
          ulElement = ulElement.parentNode;
        }
        
        // table要素を探す
        let tableElement = node;
        while (tableElement && tableElement !== editor.getBody()) {
          if (tableElement.tagName === 'TABLE') {
            break;
          }
          tableElement = tableElement.parentNode;
        }
        
        if (ulElement && ulElement.tagName === 'UL') {
          // ul全体から強調クラスを削除（インデントを保持）
          editor.dom.removeClass(ulElement, 'important');
          editor.dom.removeClass(ulElement, 'action-item');
        } else if (tableElement && tableElement.tagName === 'TABLE') {
          // table全体から強調クラスを削除
          editor.dom.removeClass(tableElement, 'important');
          editor.dom.removeClass(tableElement, 'action-item');
        } else {
          // ul/table以外の場合は従来の動作
          let parentWithClass = node;
          while (parentWithClass && parentWithClass !== editor.getBody()) {
            if (editor.dom.hasClass(parentWithClass, 'important') || 
                editor.dom.hasClass(parentWithClass, 'action-item')) {
              break;
            }
            parentWithClass = parentWithClass.parentNode;
          }
          
          if (parentWithClass && parentWithClass !== editor.getBody()) {
            const content = parentWithClass.innerHTML;
            editor.dom.removeClass(parentWithClass, 'important');
            editor.dom.removeClass(parentWithClass, 'action-item');
            parentWithClass.innerHTML = content;
          } else {
            editor.dom.removeClass(node, 'important');
            editor.dom.removeClass(node, 'action-item');
          }
        }
      }
    });
  },
};

// ローカルファイルを使用するため、APIキーは不要
