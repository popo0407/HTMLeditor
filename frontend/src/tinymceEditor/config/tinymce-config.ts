// APIキーを取得（フォールバック付き）
const apiKey = process.env.REACT_APP_TINYMCE_APIKEY || 'a8wnlcorvun75nc9v47gtkaza8c0ogfijxb4nwvauc2t942x';
console.log('Environment API Key:', process.env.REACT_APP_TINYMCE_APIKEY);
console.log('Using API Key:', apiKey);

// 基本的なTinyMCE設定
export const tinymceConfig = {
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
    "bullist numlist outdent indent | link image | table | code",
    "heading-large heading-medium heading-small heading-normal | separator | important action-item normal-text",
  ],
  branding: false,
  promotion: false,
  content_style: `
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      font-size: 14px; 
      line-height: 1.1; 
    }
    p { 
      line-height: 1.1; 
      margin: 0 0 1em 0; 
    }
    h1, h2, h3, h4, h5, h6 { 
      line-height: 1.1; 
      margin: 1em 0 0.5em 0; 
    }
    .important { 
      background-color: #fff3cd; 
      border-left: 4px solid #ffc107; 
      padding: 15px; 
      margin: 15px 0; 
    }
    .action-item { 
      background-color: #d4edda; 
      border-left: 4px solid #28a745; 
      padding: 15px; 
      margin: 15px 0; 
    }
    table { border-collapse: collapse; width: 100%; margin: 16px 0 !important; }
    table td, table th { border: 1px solid #000 !important; padding: 8px !important; }
    table th { background-color: #f8f9fa !important; font-weight: bold !important; }
    table[style*="border"] td, table[style*="border"] th { border: 1px solid #000 !important; }
    .custom-table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    .custom-table td, .custom-table th { border: 1px solid #000; padding: 8px; }
    .custom-table th { background-color: #f8f9fa; font-weight: bold; }
  `,
  setup: function (editor: any) {
    console.log('TinyMCE initialized successfully');
    
    // セパレーターを登録
    editor.ui.registry.addButton('separator', {
      text: '|',
      tooltip: '',
      onAction: function () {
        // セパレーターは何もしない
      }
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
        const node = editor.selection.getNode();
        editor.dom.removeClass(node, 'action-item');
        editor.dom.toggleClass(node, 'important');
      }
    });
    
    // アクションアイテムボタン
    editor.ui.registry.addButton('action-item', {
      text: 'アクション',
      tooltip: 'アクションアイテム（緑色背景）',
      onAction: function () {
        const node = editor.selection.getNode();
        editor.dom.removeClass(node, 'important');
        editor.dom.toggleClass(node, 'action-item');
      }
    });
    
    // 標準テキストボタン
    editor.ui.registry.addButton('normal-text', {
      text: '標準',
      tooltip: '標準テキスト（強調なし）',
      onAction: function () {
        const node = editor.selection.getNode();
        editor.dom.removeClass(node, 'important');
        editor.dom.removeClass(node, 'action-item');
      }
    });
  },
};

// APIキーをエクスポート
export { apiKey };
