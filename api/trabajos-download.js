// POST /api/trabajos-download
// Body: {
//   tipo: 'docx'|'pptx',
//   titulo: string,
//   contentHtml: string,     (for docx)
//   slidesJson: {...},       (for pptx)
//   ramoColor: '#rrggbb',
// }
// Returns: binary file with Content-Disposition attachment
// Note: PDF download is handled client-side via html2pdf.js (no endpoint needed)

import HTMLtoDOCX from 'html-to-docx';
import PptxGenJS from 'pptxgenjs';

// ── PPTX slide builder ───────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = (hex || '#1654b0').replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return { r, g, b };
}

function colorFromHex(hex) {
  // pptxgenjs expects 6-char hex without #
  return (hex || '#1654b0').replace('#', '').toUpperCase();
}

async function buildPptx(slidesJson, titulo, ramoColor) {
  const pptx   = new PptxGenJS();
  const accent = colorFromHex(ramoColor);
  const white  = 'FFFFFF';
  const dark   = '1D1D1F';
  const subtle = 'F5F5F7';

  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
  pptx.layout = 'WIDE';

  const slides = slidesJson?.slides || [];

  for (const slide of slides) {
    const s = pptx.addSlide();

    if (slide.type === 'portada') {
      // Full-color background
      s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: accent } });
      s.addText(slide.title || titulo, {
        x: 0.8, y: 2.0, w: 11.7, h: 1.2,
        fontSize: 32, bold: true, color: white, align: 'left',
        fontFace: 'Helvetica Neue',
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.8, y: 3.4, w: 11.7, h: 0.6,
          fontSize: 18, color: 'FFFFFFCC', align: 'left',
        });
      }
      if (slide.details) {
        s.addText(slide.details, {
          x: 0.8, y: 6.3, w: 11.7, h: 0.6,
          fontSize: 13, color: 'FFFFFF99', align: 'left',
        });
      }

    } else if (slide.type === 'cierre') {
      s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: accent } });
      s.addText(slide.title || '¿Preguntas?', {
        x: 0.8, y: 2.8, w: 11.7, h: 1.2,
        fontSize: 36, bold: true, color: white, align: 'center',
      });
      if (slide.subtitle) {
        s.addText(slide.subtitle, {
          x: 0.8, y: 4.2, w: 11.7, h: 0.6,
          fontSize: 16, color: 'FFFFFFBB', align: 'center',
        });
      }

    } else {
      // Standard content slide
      s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: '100%', h: 0.7, fill: { color: accent } });
      s.addText(slide.title || '', {
        x: 0.5, y: 0.1, w: 12.4, h: 0.5,
        fontSize: 16, bold: true, color: white, valign: 'middle',
      });

      const bullets = slide.bullets || [];
      if (bullets.length > 0) {
        const bulletObjs = bullets.map(b => ({
          text: b,
          options: { bullet: { code: '2022' }, fontSize: 16, color: dark, paraSpaceAfter: 6 },
        }));
        s.addText(bulletObjs, {
          x: 0.6, y: 1.0, w: 12.0, h: 6.0,
          valign: 'top', fontFace: 'Helvetica Neue',
        });
      }
    }

    // Slide number (bottom right)
    s.addText(`${slides.indexOf(slide) + 1}`, {
      x: 12.5, y: 7.1, w: 0.6, h: 0.25,
      fontSize: 9, color: 'AAAAAA', align: 'right',
    });
  }

  return pptx.write({ outputType: 'nodebuffer' });
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    tipo        = 'docx',
    titulo      = 'Trabajo',
    contentHtml = '',
    slidesJson  = null,
    ramoColor   = '#1654b0',
  } = req.body ?? {};

  const safeName = titulo.replace(/[^a-zA-Z0-9\u00C0-\u024F\s-]/g, '').trim() || 'trabajo';

  try {
    if (tipo === 'docx') {
      // ── DOCX ───────────────────────────────────────────────────────────────
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 2cm; }
  h1 { font-size: 18pt; font-weight: bold; margin-top: 24pt; margin-bottom: 12pt; }
  h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 8pt; }
  h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
  p  { margin-bottom: 8pt; }
  ul, ol { margin-left: 1.5em; margin-bottom: 8pt; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 12pt; }
  th, td { border: 1px solid #ccc; padding: 6pt; }
  th { background-color: #f0f0f0; font-weight: bold; }
</style>
</head><body>${contentHtml}</body></html>`;

      const buffer = await HTMLtoDOCX(fullHtml, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
        margins: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}.docx"`);
      return res.send(buffer);

    } else if (tipo === 'pptx') {
      // ── PPTX ───────────────────────────────────────────────────────────────
      if (!slidesJson?.slides?.length) {
        return res.status(400).json({ error: 'slidesJson.slides requerido para pptx' });
      }

      const buffer = await buildPptx(slidesJson, titulo, ramoColor);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}.pptx"`);
      return res.send(Buffer.from(buffer));

    } else {
      return res.status(400).json({ error: `Tipo "${tipo}" no soportado en este endpoint (PDF se genera client-side)` });
    }
  } catch (err) {
    console.error('[trabajos-download] error:', err);
    return res.status(500).json({ error: err.message || 'Error al generar archivo' });
  }
}
