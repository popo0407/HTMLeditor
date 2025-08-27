import subprocess
import tempfile
import os
from pathlib import Path
from typing import Optional

WKHTMLTOPDF_PATH = os.getenv('WKHTMLTOPDF_PATH', str(Path(__file__).resolve().parents[2] / 'wkhtmltopdf.exe'))


def generate_pdf_from_html(html: str, timeout: int = 30, use_header: bool = True) -> bytes:
    """Generate PDF bytes from HTML using wkhtmltopdf.

    Raises RuntimeError on failure.
    """
    # write html to a temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as h:
        h.write(html)
        html_path = h.name

    pdf_fd, pdf_path = tempfile.mkstemp(suffix='.pdf')
    os.close(pdf_fd)

    # Header template path
    header_path = None
    if use_header:
        backend_dir = Path(__file__).resolve().parents[1]  # backend/
        header_template_path = backend_dir / 'templates' / 'header.html'
        if header_template_path.exists():
            header_path = str(header_template_path)

    try:
        cmd = [
            WKHTMLTOPDF_PATH,
            '--disable-javascript',
            '--no-images',
            '--margin-top', '25mm',
            '--margin-bottom', '15mm',
            '--margin-left', '15mm',
            '--margin-right', '15mm'
        ]
        
        # Add header if available
        if header_path:
            cmd.extend(['--header-html', header_path])
            cmd.extend(['--header-spacing', '5'])
        
        cmd.extend([html_path, pdf_path])
        
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
        if proc.returncode != 0:
            raise RuntimeError(f"wkhtmltopdf failed: {proc.stderr.decode(errors='ignore')}")

        with open(pdf_path, 'rb') as f:
            data = f.read()

        if not data:
            raise RuntimeError('Generated PDF is empty')

        return data
    finally:
        try:
            os.unlink(html_path)
        except Exception:
            pass
        try:
            os.unlink(pdf_path)
        except Exception:
            pass
