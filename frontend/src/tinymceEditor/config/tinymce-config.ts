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
    .important { background-color: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; }
    .action-item { background-color: #d1ecf1; color: #0c5460; padding: 8px; border-radius: 4px; }
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
  },
};

// APIキーをエクスポート
export { apiKey };
