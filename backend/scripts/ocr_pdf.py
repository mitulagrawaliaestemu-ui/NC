import asyncio
import os
import sys
import argparse
import pypdfium2 as pdfium
from PIL import Image
import winrt.windows.graphics.imaging as imaging
import winrt.windows.media.ocr as ocr
import winrt.windows.storage.streams as streams

def load_image_pillow(pil_image):
    """Converts a PIL image to a SoftwareBitmap."""
    image = pil_image.convert("RGBA")
    data_writer = streams.DataWriter()
    data_writer.write_bytes(image.tobytes())
    
    bitmap = imaging.SoftwareBitmap(
        imaging.BitmapPixelFormat.RGBA8, 
        image.width, 
        image.height
    )
    bitmap.copy_from_buffer(data_writer.detach_buffer())
    return bitmap

async def run_ocr_on_pil_image(pil_image):
    engine = ocr.OcrEngine.try_create_from_user_profile_languages()
    if not engine:
        langs = ocr.OcrEngine.available_recognizer_languages
        if len(langs) > 0:
            engine = ocr.OcrEngine.try_create_from_language(langs[0])
        else:
            raise RuntimeError("No OCR languages available on this system.")
            
    bitmap = load_image_pillow(pil_image)
    result = await engine.recognize_async(bitmap)
    return result

async def main():
    parser = argparse.ArgumentParser(description="OCR a PDF file using Windows OCR engine.")
    parser.add_argument("pdf_path", help="Path to the PDF file")
    parser.add_argument("--output", help="Path to write the output text file")
    args = parser.parse_args()

    pdf_path = args.pdf_path
    if not os.path.exists(pdf_path):
        print(f"Error: File not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
        
    try:
        pdf = pdfium.PdfDocument(pdf_path)
    except Exception as e:
        print(f"Error opening PDF: {e}", file=sys.stderr)
        sys.exit(1)
        
    all_text = []
    for page_number in range(len(pdf)):
        page = pdf.get_page(page_number)
        
        # Render page to PdfBitmap
        bitmap = page.render(scale=3)
        pil_image = bitmap.to_pil()
        
        # Run OCR
        result = await run_ocr_on_pil_image(pil_image)
        all_text.append(f"--- PAGE {page_number + 1} ---\n" + result.text)
        
    full_text = "\n\n".join(all_text)
    
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(full_text)
        print(f"OCR completed. Saved to {args.output}")
    else:
        print(full_text)

if __name__ == "__main__":
    asyncio.run(main())
