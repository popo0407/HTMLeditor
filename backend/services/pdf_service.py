import subprocess
import tempfile
import os
from pathlib import Path
from typing import Optional

WKHTMLTOPDF_PATH = os.getenv('WKHTMLTOPDF_PATH', str(Path(__file__).resolve().parents[2] / 'wkhtmltopdf.exe'))


def generate_pdf_from_html(html: str, timeout: int = 30) -> bytes:
    """Generate PDF bytes from HTML using wkhtmltopdf.

    Raises RuntimeError on failure.
    """
    # write html to a temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as h:
        h.write(html)
        html_path = h.name

    pdf_fd, pdf_path = tempfile.mkstemp(suffix='.pdf')
    os.close(pdf_fd)

    try:
        cmd = [WKHTMLTOPDF_PATH, '--disable-javascript', '--no-images', html_path, pdf_path]
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
