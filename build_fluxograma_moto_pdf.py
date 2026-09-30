import os
import re
import base64
import subprocess
from pathlib import Path

# Paths
WORKSPACE_ROOT = Path(r"c:\Users\Corpvs\Documents\wiki frota\wiki-gestao-frota")
IMAGES_DIR = WORKSPACE_ROOT / "frontend" / "public" / "images" / "fluxograma_moto"
DOCUMENTS_DIR = WORKSPACE_ROOT / "frontend" / "public" / "documents"
BACKEND_DOCS_DIR = WORKSPACE_ROOT / "backend" / "private" / "documents"
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
BACKEND_DOCS_DIR.mkdir(parents=True, exist_ok=True)

PDF_OUTPUT_PATH = DOCUMENTS_DIR / "fluxograma_bloqueio_moto.pdf"
BACKEND_PDF_PATH = BACKEND_DOCS_DIR / "fluxograma-bloqueio-moto.pdf"
HTML_OUTPUT_PATH = WORKSPACE_ROOT / "temp_fluxograma_moto_presentation.html"

# Helper to get base64 data URI of images
def get_image_base64(path):
    p = Path(path)
    if not p.exists():
        print(f"Warning: {p} not found!")
        return ""
    with open(p, "rb") as f:
        data = f.read()
    ext = p.suffix.lower()
    mime = "image/png"
    if ext in [".jpg", ".jpeg"]:
        mime = "image/jpeg"
    elif ext == ".svg":
        mime = "image/svg+xml"
    b64 = base64.b64encode(data).decode("utf-8")
    return f"data:{mime};base64,{b64}"

# Extract base64 logo from LOGOELETRONICACIRCLE.svg
logo_svg_path = WORKSPACE_ROOT / "frontend" / "public" / "images" / "LOGOELETRONICACIRCLE.svg"
logo_symbol_b64 = ""
if logo_svg_path.exists():
    with open(logo_svg_path, "r", encoding="utf-8") as f:
        svg_content = f.read()
    match = re.search(r'data:image/png;base64,([^\"]+)', svg_content)
    if match:
        logo_symbol_b64 = f"data:image/png;base64,{match.group(1)}"

# Load images
img_local_instalacao = get_image_base64(IMAGES_DIR / "local_instalacao.png")

# Header HTML snippet for slides
def render_header(step_num=None, title=None):
    step_html = ""
    if step_num and title:
        step_html = f"""
        <div class="slide-header-title-box">
            <span class="slide-badge">{step_num}</span>
            <div class="title-with-line">
                <h2 class="slide-header-title">{title}</h2>
                <div class="header-blue-line"></div>
            </div>
        </div>
        """
    return f"""
    <div class="slide-header">
        <div class="corpvs-logo-group">
            <img src="{logo_symbol_b64}" class="corpvs-eagle-img" alt="Corpvs" />
            <div class="corpvs-text-box">
                <span class="corpvs-brand-name">CORPVS</span>
                <span class="corpvs-tagline">MAIS QUE SEGURANÇA... TECNOLOGIA!</span>
            </div>
        </div>
        {step_html}
        <div class="dot-grid">
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
        </div>
    </div>
    """

# Footer decoration
footer_html = """
<div class="slide-footer">
    <span class="footer-text">Wiki Gestão de Frota | Operação Solar Coca-Cola & Corpvs Tecnologia</span>
</div>
<div class="tech-wave-bg">
    <svg viewBox="0 0 350 250" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 250 C120 220 180 180 230 110 C270 50 310 20 350 0 L350 250 Z" fill="#0f2e60" opacity="0.95"/>
        <path d="M0 250 C90 230 150 190 200 130 C240 80 290 40 350 10 L350 250 Z" fill="#004899" opacity="0.6"/>
        <circle cx="210" cy="120" r="4" fill="#38bdf8"/>
        <line x1="210" y1="120" x2="260" y2="120" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="2 2"/>
        <circle cx="260" cy="120" r="3" fill="#38bdf8"/>
        <circle cx="250" cy="70" r="4" fill="#38bdf8"/>
        <line x1="250" y1="70" x2="280" y2="90" stroke="#38bdf8" stroke-width="1.5"/>
        <circle cx="280" cy="90" r="3" fill="#38bdf8"/>
    </svg>
</div>
"""

html_content = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Fluxograma Bloqueio de Moto - Manual Operacional</title>
<style>
@page {{
    size: 297mm 210mm;
    margin: 0;
}}
@media print {{
    body {{
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }}
}}
* {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}}
body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #cbd5e1;
    color: #1e293b;
    -webkit-font-smoothing: antialiased;
}}
.slide {{
    width: 297mm;
    height: 210mm;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
    background: #ffffff;
    overflow: hidden;
    padding: 16mm 22mm 14mm 22mm;
    display: flex;
    flex-direction: column;
}}
/* Header */
.slide-header {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 24mm;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 3mm;
    margin-bottom: 4mm;
    position: relative;
    z-index: 10;
}}
.corpvs-logo-group {{
    display: flex;
    align-items: center;
    gap: 12px;
}}
.corpvs-eagle-img {{
    height: 48px;
    width: auto;
    object-fit: contain;
}}
.corpvs-text-box {{
    display: flex;
    flex-direction: column;
}}
.corpvs-brand-name {{
    font-size: 26px;
    font-weight: 900;
    letter-spacing: 0.05em;
    color: #0f2e60;
    line-height: 1;
}}
.corpvs-tagline {{
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 0.16em;
    color: #0284c7;
    margin-top: 3px;
}}
.slide-header-title-box {{
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    margin-left: 20px;
    min-width: 0;
}}
.slide-badge {{
    background: #0f2e60;
    color: #ffffff;
    font-size: 19px;
    font-weight: 800;
    padding: 5px 13px;
    border-radius: 8px;
    letter-spacing: 0.05em;
    box-shadow: 0 4px 10px rgba(15, 46, 96, 0.25);
    white-space: nowrap;
}}
.title-with-line {{
    display: flex;
    flex-direction: column;
    min-width: 0;
}}
.slide-header-title {{
    font-size: 21px;
    font-weight: 900;
    color: #0f2e60;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    line-height: 1.1;
    white-space: nowrap;
}}
.header-blue-line {{
    width: 90px;
    height: 3px;
    background: #0f2e60;
    margin-top: 4px;
    border-radius: 2px;
}}
.dot-grid {{
    display: grid;
    grid-template-columns: repeat(3, 5px);
    grid-gap: 5px;
    opacity: 0.75;
}}
.dot-grid span {{
    width: 5px;
    height: 5px;
    background-color: #3b82f6;
    border-radius: 50%;
}}
/* Slide Body Grid */
.slide-body-grid {{
    display: grid;
    grid-template-columns: 46% 54%;
    gap: 22px;
    flex: 1;
    align-items: center;
    position: relative;
    z-index: 5;
    min-height: 0;
}}
/* Left Column */
.left-col {{
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 11px;
    padding-right: 6px;
}}
.step-intro {{
    font-size: 13.5px;
    color: #334155;
    line-height: 1.45;
}}
.step-list {{
    display: flex;
    flex-direction: column;
    gap: 9px;
}}
.step-item {{
    display: flex;
    align-items: flex-start;
    gap: 11px;
}}
.num-circle {{
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: #004899;
    color: #ffffff;
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    box-shadow: 0 2px 6px rgba(0, 72, 153, 0.3);
}}
.step-content {{
    font-size: 12.5px;
    color: #1e293b;
    line-height: 1.4;
}}
.step-content strong {{
    color: #0f2e60;
    font-weight: 700;
}}
.callout-box {{
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #f0f7ff;
    border: 1.5px solid #0284c7;
    border-radius: 12px;
    padding: 9px 12px;
    margin-top: 4px;
}}
.callout-box.alert {{
    background: #fef2f2;
    border-color: #ef4444;
}}
.callout-box.success {{
    background: #f0fdf4;
    border-color: #22c55e;
}}
.callout-box.warning {{
    background: #fffbeb;
    border-color: #f59e0b;
}}
.callout-icon {{
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #0284c7;
    color: #0284c7;
    font-weight: 900;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}}
.callout-box.alert .callout-icon {{
    border-color: #ef4444;
    color: #ef4444;
}}
.callout-box.warning .callout-icon {{
    border-color: #f59e0b;
    color: #f59e0b;
}}
.callout-text {{
    font-size: 11.5px;
    color: #0c4a6e;
    line-height: 1.35;
}}
.callout-box.alert .callout-text {{
    color: #991b1b;
}}
.callout-box.warning .callout-text {{
    color: #92400e;
}}
.callout-text strong {{
    color: #0284c7;
    font-weight: 700;
}}
.callout-box.alert .callout-text strong {{
    color: #b91c1c;
}}
.callout-box.warning .callout-text strong {{
    color: #b45309;
}}
/* Right Column */
.right-col {{
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;
}}
.image-frame {{
    width: 100%;
    height: 100%;
    max-height: 140mm;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 14px;
    box-shadow: 0 10px 25px -5px rgba(15, 46, 96, 0.15);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}}
.image-frame img {{
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}}
/* Footer */
.slide-footer {{
    position: absolute;
    bottom: 6mm;
    left: 22mm;
    z-index: 10;
}}
.footer-text {{
    font-size: 10px;
    color: #94a3b8;
    font-weight: 500;
    letter-spacing: 0.05em;
}}
.tech-wave-bg {{
    position: absolute;
    bottom: 0;
    right: 0;
    width: 100mm;
    height: 75mm;
    z-index: 1;
    pointer-events: none;
}}
.tech-wave-bg svg {{
    width: 100%;
    height: 100%;
}}
/* COVER PAGE SPECIFICS */
.cover-container {{
    display: flex;
    height: 100%;
    position: relative;
    z-index: 5;
}}
.cover-left {{
    width: 65%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-top: 10mm;
    padding-bottom: 6mm;
}}
.cover-titles {{
    display: flex;
    flex-direction: column;
    margin-top: 10mm;
}}
.cover-title-guia {{
    font-size: 40px;
    font-weight: 900;
    color: #0f2e60;
    letter-spacing: 0.05em;
    line-height: 1;
}}
.cover-title-operacional {{
    font-size: 64px;
    font-weight: 900;
    color: #0f2e60;
    letter-spacing: 0.02em;
    line-height: 1.05;
}}
.cover-title-de {{
    font-size: 24px;
    font-weight: 800;
    color: #004899;
    letter-spacing: 0.08em;
    margin-top: 4px;
}}
.cover-title-main {{
    font-size: 44px;
    font-weight: 900;
    color: #004899;
    letter-spacing: 0.02em;
    line-height: 1.1;
}}
.cover-subtitle {{
    font-size: 14px;
    font-weight: 700;
    color: #475569;
    letter-spacing: 0.06em;
    margin-top: 14px;
    text-transform: uppercase;
}}
.cover-tag {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #e0f2fe;
    border: 1px solid #7dd3fc;
    color: #0369a1;
    font-size: 12px;
    font-weight: 800;
    padding: 6px 14px;
    border-radius: 20px;
    margin-top: 14px;
    width: fit-content;
}}
.cover-features-row {{
    display: flex;
    gap: 16px;
    margin-top: 16mm;
}}
.feature-pill {{
    display: flex;
    align-items: center;
    gap: 12px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 10px 16px;
    box-shadow: 0 4px 12px rgba(15, 46, 96, 0.08);
}}
.feature-icon-box {{
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #f0f7ff;
    border: 1px solid #bae6fd;
    color: #0284c7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
}}
.feature-pill-text {{
    font-size: 12px;
    font-weight: 700;
    color: #0f2e60;
    line-height: 1.3;
}}
.cover-right-bg {{
    position: absolute;
    top: 0;
    right: -22mm;
    width: 145mm;
    height: 210mm;
    z-index: 1;
}}
/* SUMMARY SLIDE SPECIFICS */
.intro-text-block {{
    display: flex;
    flex-direction: column;
    gap: 14px;
    font-size: 13.5px;
    color: #334155;
    line-height: 1.55;
}}
.intro-text-block strong {{
    color: #0f2e60;
}}
.summary-card {{
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 18px;
    box-shadow: 0 10px 25px -5px rgba(15, 46, 96, 0.1);
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}}
.summary-card-header {{
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 8px;
    border-bottom: 1.5px solid #f1f5f9;
}}
.summary-header-icon {{
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #004899;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
}}
.summary-card-title {{
    font-size: 15px;
    font-weight: 900;
    color: #0f2e60;
    letter-spacing: 0.05em;
}}
.summary-item-row {{
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 3.5px 0;
}}
.summary-badge {{
    width: 32px;
    height: 25px;
    background: #004899;
    color: #ffffff;
    font-size: 12.5px;
    font-weight: 800;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}}
.summary-item-info {{
    display: flex;
    flex-direction: column;
}}
.summary-item-name {{
    font-size: 11.5px;
    font-weight: 800;
    color: #0f2e60;
}}
.summary-item-desc {{
    font-size: 10px;
    color: #64748b;
}}
/* TABLES IN SLIDES */
.custom-table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    margin: 4px 0;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
}}
.custom-table th {{
    background: #0f2e60;
    color: #ffffff;
    font-weight: 700;
    padding: 6px 8px;
    text-align: left;
    font-size: 10.5px;
}}
.custom-table td {{
    padding: 5px 8px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    line-height: 1.25;
}}
.custom-table tr:nth-child(even) {{
    background: #f8fafc;
}}
/* CARD BOXES */
.info-card {{
    background: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px 14px;
    box-shadow: 0 4px 12px rgba(15, 46, 96, 0.05);
    display: flex;
    flex-direction: column;
    gap: 6px;
}}
.info-card-title {{
    font-size: 13px;
    font-weight: 800;
    color: #0f2e60;
    display: flex;
    align-items: center;
    gap: 8px;
}}
.info-card-text {{
    font-size: 11.5px;
    color: #475569;
    line-height: 1.4;
}}
/* FLOWCHART STYLES */
.flow-container {{
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    height: 100%;
    justify-content: center;
}}
.flow-row {{
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
}}
.flow-node {{
    background: #ffffff;
    border: 2px solid #004899;
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 700;
    color: #0f2e60;
    box-shadow: 0 4px 8px rgba(15, 46, 96, 0.1);
    text-align: center;
    max-width: 220px;
    line-height: 1.25;
}}
.flow-node.start {{
    background: #0f2e60;
    border-color: #0f2e60;
    color: #ffffff;
    font-size: 12px;
}}
.flow-node.decision {{
    background: #f0f7ff;
    border-color: #0284c7;
    color: #0369a1;
}}
.flow-node.action {{
    background: #f8fafc;
    border-color: #64748b;
    color: #1e293b;
}}
.flow-node.success {{
    background: #f0fdf4;
    border-color: #16a34a;
    color: #166534;
}}
.flow-node.alert {{
    background: #fef2f2;
    border-color: #dc2626;
    color: #991b1b;
}}
.flow-arrow {{
    font-size: 14px;
    color: #004899;
    font-weight: 900;
}}
</style>
</head>
<body>

<!-- SLIDE 1: CAPA -->
<div class="slide">
    <div class="slide-header" style="border: none; margin-bottom: 0;">
        <div class="corpvs-logo-group">
            <img src="{logo_symbol_b64}" class="corpvs-eagle-img" alt="Corpvs" style="height: 58px;" />
            <div class="corpvs-text-box">
                <span class="corpvs-brand-name" style="font-size: 32px;">CORPVS</span>
                <span class="corpvs-tagline" style="font-size: 9px;">MAIS QUE SEGURANÇA... TECNOLOGIA!</span>
            </div>
        </div>
        <div class="dot-grid">
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
            <span></span><span></span><span></span>
        </div>
    </div>

    <div class="cover-container">
        <div class="cover-left">
            <div class="cover-titles">
                <span class="cover-title-guia">GUIA</span>
                <span class="cover-title-operacional">OPERACIONAL</span>
                <span class="cover-title-de">DE</span>
                <span class="cover-title-main">FLUXOGRAMA BLOQUEIO DE MOTO.</span>
                <span class="cover-subtitle">DIAGNÓSTICO RÁPIDO, IDENTIFICAÇÃO RFID E PROTOCOLO DE DESBLOQUEIO</span>
                <div class="cover-tag">
                    <span>🏢</span> OPERAÇÃO SOLAR COCA-COLA & CORPVS TECNOLOGIA
                </div>
            </div>

            <div class="cover-features-row">
                <div class="feature-pill">
                    <div class="feature-icon-box">🎥</div>
                    <div class="feature-pill-text">Checklist de vídeo<br>e coleta inicial.</div>
                </div>
                <div class="feature-pill">
                    <div class="feature-icon-box">🏷️</div>
                    <div class="feature-pill-text">Validação RFID<br>& SCUTI 1-Wire.</div>
                </div>
                <div class="feature-pill">
                    <div class="feature-icon-box">🚨</div>
                    <div class="feature-pill-text">Contingência segura<br>e envio para Frotas.</div>
                </div>
            </div>
        </div>
    </div>

    <div class="cover-right-bg">
        <svg viewBox="0 0 500 700" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
            <path d="M120 700 C200 620 280 500 320 380 C360 250 420 120 500 0 L500 700 Z" fill="#0f2e60"/>
            <path d="M50 700 C150 630 230 520 270 410 C320 280 390 160 500 50 L500 700 Z" fill="#004899" opacity="0.6"/>
            <circle cx="310" cy="400" r="7" fill="#38bdf8"/>
            <line x1="310" y1="400" x2="380" y2="400" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="4 4"/>
            <circle cx="380" cy="400" r="5" fill="#38bdf8"/>
            <circle cx="340" cy="270" r="7" fill="#38bdf8"/>
            <line x1="340" y1="270" x2="410" y2="310" stroke="#38bdf8" stroke-width="2.5"/>
            <circle cx="410" cy="310" r="5" fill="#38bdf8"/>
            <circle cx="400" cy="160" r="6" fill="#38bdf8"/>
            <line x1="400" y1="160" x2="450" y2="160" stroke="#38bdf8" stroke-width="2"/>
            <circle cx="450" cy="160" r="4" fill="#38bdf8"/>
        </svg>
    </div>
</div>

<!-- SLIDE 2: INTRODUÇÃO & SUMÁRIO -->
<div class="slide">
    {render_header()}
    <div class="slide-body-grid" style="grid-template-columns: 44% 56%;">
        <div class="left-col">
            <div style="margin-bottom: 8px;">
                <h1 style="font-size: 30px; font-weight: 900; color: #0f2e60; text-transform: uppercase;">INTRODUÇÃO</h1>
                <div class="header-blue-line" style="width: 110px; height: 3.5px;"></div>
            </div>
            <div class="intro-text-block">
                <p>Este material padroniza o atendimento técnico e operacional para ocorrências em que o condutor/cliente informa: <strong>"Minha moto não está ligando"</strong>.</p>
                <p>Nas operações da <strong>Solar Coca-Cola</strong>, todas as motocicletas contam com sistema de bloqueio de ignição integrado ao rastreador e identificador RFID, exigindo validação eletrônica obrigatória antes da partida.</p>
                <p>O objetivo deste fluxograma é <strong>eliminar diagnósticos errôneos</strong>, diferenciar falhas de cartão de problemas elétricos/mecânicos, restabelecer a operação de forma segura e garantir o cumprimento dos padrões de manutenção e segurança veicular.</p>
            </div>
        </div>

        <div class="right-col">
            <div class="summary-card">
                <div class="summary-card-header">
                    <div class="summary-header-icon">📖</div>
                    <span class="summary-card-title">ESTRUTURA DESTE GUIA:</span>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">01</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">COLETA INICIAL OBRIGATÓRIA</span>
                        <span class="summary-item-desc">Placa do veículo e os 5 itens indispensáveis no vídeo demonstrativo.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">02</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">MODELOS & LOCALIZAÇÃO DO IDENTIFICADOR</span>
                        <span class="summary-item-desc">Diferenças entre motos 2025 e anteriores: carenagem vs. tanque.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">03</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">CENÁRIO A: O BIPE NÃO PARA</span>
                        <span class="summary-item-desc">Cartão não lido, identificador solto/caído e caracterização de falha.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">04</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">CENÁRIO B: BIPE PARA, SEM DESBLOQUEIO</span>
                        <span class="summary-item-desc">Interferências metálicas, validação Hexadecimal na SCUTI e 1-Wire.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">05</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">VALIDAÇÃO NO OPERACIONAL & RASTREADOR</span>
                        <span class="summary-item-desc">Checagem do campo "Motorista" na plataforma e falha no envio de dados.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">06</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">SINTOMAS DE BATERIA VS. BLOQUEIO</span>
                        <span class="summary-item-desc">Painel piscando e partida engasgando: diagnóstico elétrico preventivo.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">07</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">DIAGRAMA VISUAL DO FLUXOGRAMA</span>
                        <span class="summary-item-desc">Árvore de decisão operacional completa em formato gráfico e direto.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">08</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">CONTINGÊNCIA & SEGURANÇA OPERACIONAL</span>
                        <span class="summary-item-desc">Perfil emergencial ST4305, envio mandatório a Frotas e canais Corpvs.</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 3: 01 COLETA INICIAL OBRIGATÓRIA & CHECKLIST DE VÍDEO -->
<div class="slide">
    {render_header("01", "COLETA INICIAL OBRIGATÓRIA & CHECKLIST")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Para qualquer atendimento de bloqueio de moto, é <strong>estritamente proibido</strong> tomar decisões ou alterar configurações no sistema sem a coleta prévia de evidências auditáveis.</p>
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle">1</div>
                    <div class="step-content"><strong>Solicitação da Placa do Veículo:</strong> Permite consultar o histórico no operacional Vanguarda, modelo da moto e perfil ativo na SCUTI.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">2</div>
                    <div class="step-content"><strong>Exigência do Vídeo Completo:</strong> O condutor deve registrar a sequência exata de ignição e passagem do cartão com áudio nítido.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">3</div>
                    <div class="step-content"><strong>Análise de Áudio e Imagem:</strong> O som do bipe e o comportamento dos alertas luminosos indicam imediatamente a origem do problema.</div>
                </div>
            </div>

            <div class="callout-box alert">
                <div class="callout-icon">!</div>
                <div class="callout-text">
                    <strong>REGRA CRÍTICA DE ATENDIMENTO:</strong> Nunca abra chamado para manutenção nem envie perfis emergenciais sem o vídeo comprobatório arquivado na ocorrência.
                </div>
            </div>
        </div>

        <div class="right-col" style="flex-direction: column; gap: 12px; align-items: stretch; justify-content: center;">
            <div class="info-card" style="border-left: 4px solid #004899;">
                <span class="info-card-title">🎥 5 ITENS OBRIGATÓRIOS NO VÍDEO ENVIADO:</span>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: #1e293b;">
                        <span style="background: #e0f2fe; color: #0284c7; font-weight: 800; padding: 2px 7px; border-radius: 6px;">1</span>
                        <span><strong>Placa da moto:</strong> Visível e legível no enquadramento.</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: #1e293b;">
                        <span style="background: #e0f2fe; color: #0284c7; font-weight: 800; padding: 2px 7px; border-radius: 6px;">2</span>
                        <span><strong>Painel de instrumentos:</strong> Mostrando o comportamento das luzes.</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: #1e293b;">
                        <span style="background: #e0f2fe; color: #0284c7; font-weight: 800; padding: 2px 7px; border-radius: 6px;">3</span>
                        <span><strong>Identificador RFID:</strong> Aproximação física direta do cartão branco.</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: #1e293b;">
                        <span style="background: #e0f2fe; color: #0284c7; font-weight: 800; padding: 2px 7px; border-radius: 6px;">4</span>
                        <span><strong>Tentativa de partida:</strong> Pressionando o botão de partida no punho.</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: #1e293b;">
                        <span style="background: #e0f2fe; color: #0284c7; font-weight: 800; padding: 2px 7px; border-radius: 6px;">5</span>
                        <span><strong>Áudio claro do bipe:</strong> Permite confirmar se o som para ou persiste.</span>
                    </div>
                </div>
            </div>

            <div class="info-card" style="background: #f8fafc;">
                <span class="info-card-title">💡 Dica de Atendimento ao Operador:</span>
                <p class="info-card-text">
                    Oriente o condutor pelo WhatsApp de suporte com a mensagem padrão:<br>
                    <em>"Por favor, grave um vídeo curto mostrando a placa, o painel com meia chave, aproximando o cartão do leitor e tentando dar a partida com o som ligado."</em>
                </p>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 4: 02 MODELOS DE VEÍCULO & LOCALIZAÇÃO DO IDENTIFICADOR -->
<div class="slide">
    {render_header("02", "MODELOS & POSIÇÃO DO IDENTIFICADOR")}
    <div class="slide-body-grid" style="grid-template-columns: 50% 50%;">
        <div class="left-col">
            <p class="step-intro">O comportamento da ignição e a posição física do identificador RFID variam conforme o ano de fabricação da motocicleta:</p>

            <table class="custom-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">Modelo</th>
                        <th style="width: 35%;">Local do Leitor</th>
                        <th style="width: 40%;">Comportamento Esperado</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Motos 2025</strong></td>
                        <td>Carenagem preta, lado direito</td>
                        <td>Ao girar meia chave, a luz da injeção acende e apaga. O leitor bipa. Ao passar o cartão, <strong>o bipe cessa e a luz da injeção acende</strong>, liberando a partida.</td>
                    </tr>
                    <tr>
                        <td><strong>Motos anteriores a 2025</strong></td>
                        <td>Tanque, lado direito, acima do logo Honda</td>
                        <td>Ao girar meia chave, o painel se apaga e o leitor bipa. Ao passar o cartão, <strong>o painel volta a acender e o bipe cessa</strong>, liberando a partida.</td>
                    </tr>
                </tbody>
            </table>

            <div class="callout-box warning">
                <div class="callout-icon">i</div>
                <div class="callout-text">
                    <strong>ATENÇÃO À PARTICULARIDADE DO MODELO:</strong> Nunca considere que o painel apagado em motos anteriores a 2025 é defeito elétrico: trata-se do bloqueio ativo funcionando normalmente.
                </div>
            </div>
        </div>

        <div class="right-col" style="flex-direction: column; gap: 8px;">
            <div style="font-size: 11px; font-weight: 800; color: #0f2e60; text-transform: uppercase; width: 100%; text-align: left; padding-left: 2px;">
                📍 Local de Instalação Física nas Motocicletas
            </div>
            <div class="image-frame" style="max-height: 105mm; padding: 10px; background: #f8fafc;">
                <img src="{img_local_instalacao}" alt="Local de Instalação do Leitor RFID" />
            </div>
            <div style="font-size: 10px; color: #64748b; width: 100%; text-align: center; line-height: 1.3;">
                Ponto de fixação e aproximação do cartão RFID. Aproxime o cartão diretamente sobre o ponto demarcado.
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 5: 03 CENÁRIO A: O BIPE NÃO PARA AO PASSAR O CARTÃO -->
<div class="slide">
    {render_header("03", "CENÁRIO A: BIPE NÃO PARA COM CARTÃO")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Quando o condutor aproxima o cartão e o leitor <strong>continua bipando incessantemente</strong>, significa que o leitor <strong>não conseguiu realizar a leitura do chip RFID</strong>.</p>
            
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle">1</div>
                    <div class="step-content"><strong>Causa Mais Comum (Descolamento):</strong> Em grande parte dos casos, o leitor descolou da carenagem/tanque e caiu para o interior do chassi, ficando longe da área de leitura.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">2</div>
                    <div class="step-content"><strong>Ação Imediata com o Condutor:</strong> Solicitar que passe a mão por baixo da carenagem no ponto de instalação para verificar se o leitor está solto ou pendurado.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">3</div>
                    <div class="step-content"><strong>Teste de Reposicionamento:</strong> Se encontrado, apoiar o leitor firmemente no local original e refazer a passagem do cartão.</div>
                </div>
            </div>

            <div class="callout-box">
                <div class="callout-icon">✓</div>
                <div class="callout-text">
                    <strong>RESOLUÇÃO RÁPIDA:</strong> Se ao reposicionar o leitor o bipe cessar e a moto liberar, orientar o condutor a prender provisoriamente com fita e registrar chamado de fixação.
                </div>
            </div>
        </div>

        <div class="right-col" style="flex-direction: column; gap: 12px; align-items: stretch; justify-content: center;">
            <div class="info-card" style="border-left: 4px solid #ef4444;">
                <span class="info-card-title" style="color: #b91c1c;">⚠️ QUANDO CARACTERIZAR FALHA NO IDENTIFICADOR:</span>
                <p class="info-card-text">
                    Se o condutor comprovar via vídeo que o identificador está no <strong>local correto</strong> (ou em mãos), o cartão foi aproximado a menos de 1 cm, e o <strong>bipe não para de tocar</strong>:
                </p>
                <div style="background: #fef2f2; border: 1px dashed #f87171; border-radius: 8px; padding: 10px; margin-top: 4px;">
                    <div style="font-size: 11.5px; font-weight: 800; color: #991b1b;">Diagnóstico: Falha de Leitor RFID / Rompimento de Chicote</div>
                    <div style="font-size: 10.5px; color: #7f1d1d; margin-top: 3px;">
                        • Aplicar Perfil Emergencial: <code>ST4305_ALGAR_FROTA_PADRÃO</code>.<br>
                        • A moto passará a ligar sem bloqueio para contingência.<br>
                        • <strong>Encaminhar imediatamente para manutenção no setor de Frotas.</strong>
                    </div>
                </div>
            </div>

            <div class="info-card" style="background: #f0f7ff; border-color: #bae6fd;">
                <span class="info-card-title" style="color: #0369a1;">📋 Procedimento com Cartão Reserva:</span>
                <p class="info-card-text">
                    Antes de declarar falha de hardware, solicite o teste com o cartão reserva da unidade (ou de outro colaborador da mesma base) para descartar chip RFID quebrado/danificado.
                </p>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 6: 04 CENÁRIO B: BIPE PARA, MAS A MOTO NÃO DESBLOQUEIA -->
<div class="slide">
    {render_header("04", "CENÁRIO B: BIPE CESSA, SEM DESBLOQUEIO")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Neste cenário, o som do bipe <strong>para ao aproximar o cartão</strong> (indicando que a leitura ocorreu), porém o bloqueio não é liberado e a moto não liga.</p>
            
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle" style="background: #0284c7;">1</div>
                    <div class="step-content"><strong>Passo 1: Eliminar Interferências:</strong> Celulares, chaves metálicas e crachás na mesma bolsa causam erro de leitura de bits. Exigir passagem do cartão totalmente isolado.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle" style="background: #0284c7;">2</div>
                    <div class="step-content"><strong>Passo 2: Solicitar Foto Nítida do Cartão:</strong> Coletar a numeração hexadecimal de 8 caracteres impressa no cartão (ex: <code>410ED137</code>).</div>
                </div>
                <div class="step-item">
                    <div class="num-circle" style="background: #0284c7;">3</div>
                    <div class="step-content"><strong>Passo 3: Validação no Perfil SCUTI:</strong> Baixar o perfil correspondente da moto (ex: <code>ST4305_ALGAR_COCA_MOTO</code>) e buscar pelo HEX do cartão.</div>
                </div>
            </div>

            <div class="callout-box warning">
                <div class="callout-icon">!</div>
                <div class="callout-text">
                    <strong>SINTOMA POR MODELO:</strong> Em motos antigas o painel permanece desligado. Em motos 2025 a luz da injeção não acende após o bipe parar.
                </div>
            </div>
        </div>

        <div class="right-col" style="flex-direction: column; gap: 12px; align-items: stretch; justify-content: center;">
            <div class="info-card" style="border-left: 4px solid #0284c7;">
                <span class="info-card-title">⚙️ PROCEDIMENTO DE CORREÇÃO NA PLATAFORMA SCUTI:</span>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px 10px;">
                        <span style="font-size: 11px; font-weight: 800; color: #166534;">CASO A: NÚMERO HEX LOCALIZADO NO PERFIL</span>
                        <p style="font-size: 10.5px; color: #14532d; margin-top: 2px;">
                            O cartão já consta na lista de autorizações. Reenvie o perfil completo para a moto via SCUTI e solicite novo teste após 3 minutos.
                        </p>
                    </div>

                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 10px;">
                        <span style="font-size: 11px; font-weight: 800; color: #92400e;">CASO B: NÚMERO NÃO LOCALIZADO NO PERFIL</span>
                        <p style="font-size: 10.5px; color: #78350f; margin-top: 2px;">
                            O cartão não está autorizado para a frota. Efetue a conversão de <strong>Hexadecimal para 1-Wire</strong>, insira no perfil, salve e atualize a moto.
                        </p>
                    </div>
                </div>
            </div>

            <div class="info-card" style="background: #f8fafc;">
                <span class="info-card-title">📘 Consulta ao Manual de Configuração:</span>
                <p class="info-card-text">
                    Utilize a ferramenta de conversão 1-Wire disponível na aba Ferramentas Técnicas da Wiki para gerar a linha de comando exata.
                </p>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 7: 05 VALIDAÇÃO NO OPERACIONAL & FALHA DO RASTREADOR -->
<div class="slide">
    {render_header("05", "VALIDAÇÃO OPERACIONAL & RASTREADOR")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Em determinadas situações, o leitor emite o bipe de leitura e o cartão está validado na SCUTI, porém o veículo permanece bloqueado porque o <strong>rastreador não processa ou não transmite a telemetria</strong>.</p>
            
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle">1</div>
                    <div class="step-content"><strong>Consulta da Placa na Tela Operacional:</strong> Acessar a tela inicial do Vanguarda e localizar o veículo em tempo real.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">2</div>
                    <div class="step-content"><strong>Verificação da Coluna "Motorista":</strong> Observar se o nome ou matrícula do condutor aparece associado à placa no momento do teste.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">3</div>
                    <div class="step-content"><strong>Diagnóstico de Ausência de Dados:</strong> Se o campo "Motorista" permanecer vazio mesmo com a leitura confirmada, há falha de comunicação entre leitor e rastreador.</div>
                </div>
            </div>

            <div class="callout-box alert">
                <div class="callout-icon">!</div>
                <div class="callout-text">
                    <strong>FALHA DE RASTREADOR:</strong> Quando a informação do cartão lido não chega à CPU do rastreador, o relé de bloqueio não recebe ordem para armar.
                </div>
            </div>
        </div>

        <div class="right-col" style="flex-direction: column; gap: 12px; align-items: stretch; justify-content: center;">
            <div class="info-card" style="border-left: 4px solid #f59e0b;">
                <span class="info-card-title">🔍 FLUXO DE TRATATIVA PARA FALHA NO RASTREADOR:</span>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                    <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: #1e293b;">
                        <span style="font-weight: 800; color: #d97706;">ETAPA 1:</span>
                        <span>Confirmar se o rastreador está comunicando (GPRS conectado nas últimas 2 horas).</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: #1e293b;">
                        <span style="font-weight: 800; color: #d97706;">ETAPA 2:</span>
                        <span>Se estiver em área de sombra (sem sinal), orientar deslocamento para local aberto.</span>
                    </div>
                    <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 11px; color: #1e293b;">
                        <span style="font-weight: 800; color: #d97706;">ETAPA 3:</span>
                        <span>Persistindo a falha, aplicar <code>ST4305_ALGAR_FROTA_PADRÃO</code> para remoção emergencial e agendar chamado com a equipe de campo.</span>
                    </div>
                </div>
            </div>

            <div class="info-card" style="background: #f8fafc;">
                <span class="info-card-title">🛡️ Integridade do Ranking de Condutores:</span>
                <p class="info-card-text">
                    Lembre-se: sem a identificação do motorista vinculada, as viagens do colaborador não pontuam no Ranking Solar Coca-Cola. A regularização técnica é prioritária.
                </p>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 8: 06 SINTOMAS DE BATERIA VS. BLOQUEIO & CASOS ATÍPICOS -->
<div class="slide">
    {render_header("06", "BATERIA FRACA VS. BLOQUEIO DE MOTO")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Grande parte dos chamados abertos como "bloqueio travado" são, na realidade, <strong>defeitos na bateria ou no motor de arranque</strong> da moto.</p>
            
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle" style="background: #eab308;">⚡</div>
                    <div class="step-content"><strong>Painel Piscando:</strong> Quando o condutor aperta o botão de partida e o painel apaga ou pisca repetidamente, há queda severa de tensão elétrica.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle" style="background: #eab308;">⚡</div>
                    <div class="step-content"><strong>Partida Fraca / Relé Estalando:</strong> O motor de arranque gira pesado ou emite estalos rápidos sem conseguir girar o motor a combustão.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle" style="background: #eab308;">⚡</div>
                    <div class="step-content"><strong>Moto "Engasgando":</strong> Ao tentar dar a partida a moto ameaça ligar e morre imediatamente por falta de centelha adequada.</div>
                </div>
            </div>

            <div class="callout-box alert">
                <div class="callout-icon">!</div>
                <div class="callout-text">
                    <strong>NÃO ALTERAR PERFIS TELEMÉTRICOS:</strong> Nunca aplique perfis de liberação ou mexa em comandos SCUTI quando o sintoma for de bateria descarregada.
                </div>
            </div>
        </div>

        <div class="right-col" style="flex-direction: column; gap: 12px; align-items: stretch; justify-content: center;">
            <div class="info-card" style="border-left: 4px solid #eab308;">
                <span class="info-card-title">🔋 PROTOCOLO PARA SUSPEITA DE BATERIA / ELÉTRICA:</span>
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                    <div style="font-size: 11.5px; color: #1e293b; line-height: 1.4;">
                        <strong>1. Teste de Farol e Buzina:</strong> Solicitar ao condutor que acione a buzina com meia chave ligada. Se o som sair rouco ou fraco, a bateria está sem carga.
                    </div>
                    <div style="font-size: 11.5px; color: #1e293b; line-height: 1.4;">
                        <strong>2. Descarte de Falha de Cartão:</strong> Explicar ao condutor que o bloqueio de telemetria corta apenas a ignição, não causando enfraquecimento do motor de partida.
                    </div>
                    <div style="font-size: 11.5px; color: #1e293b; line-height: 1.4;">
                        <strong>3. Encaminhamento Adequado:</strong> Direcionar a ocorrência para a manutenção mecânica/elétrica local ou troca emergencial da bateria.
                    </div>
                </div>
            </div>

            <div class="info-card" style="background: #f8fafc;">
                <span class="info-card-title">🔍 Casos Atípicos Não Catalogados:</span>
                <p class="info-card-text">
                    Caso a moto apresente comportamento mecânico incomum ou cheiro de queimado no chicote, solicite o desligamento imediato da ignição e acione o suporte técnico avançado da Corpvs.
                </p>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 9: 07 ÁRVORE DE DECISÃO VISUAL (DIAGRAMA DO FLUXOGRAMA) -->
<div class="slide">
    {render_header("07", "ÁRVORE DE DECISÃO VISUAL COMPLETA")}
    <div style="display: flex; flex-direction: column; gap: 10px; flex: 1; justify-content: center; z-index: 5; margin-top: -5px;">
        
        <div style="display: flex; justify-content: center; align-items: center; gap: 14px;">
            <div class="flow-node start" style="padding: 6px 14px;">
                🚨 OCORRÊNCIA INICIAL<br><span style="font-weight: 400; font-size: 10px;">"Minha moto não está ligando"</span>
            </div>
            <span class="flow-arrow">➔</span>
            <div class="flow-node action" style="padding: 6px 14px;">
                📹 EXIGIR COLETA INICIAL<br><span style="font-weight: 400; font-size: 10px;">Placa + Vídeo com som do bipe</span>
            </div>
            <span class="flow-arrow">➔</span>
            <div class="flow-node decision" style="padding: 6px 14px;">
                ⚡ SINTOMA ELÉTRICO?<br><span style="font-weight: 400; font-size: 10px;">Painel pisca / partida engasga?</span>
            </div>
            <span class="flow-arrow">➔</span>
            <div class="flow-node alert" style="padding: 6px 14px; max-width: 180px;">
                🔋 BATERIA FRACA<br><span style="font-weight: 400; font-size: 9.5px;">Encaminhar para autoelétrica</span>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 48% 52%; gap: 14px; margin-top: 6px;">
            
            <!-- RAMO A: BIPE NÃO PARA -->
            <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #f1f5f9; pb: 4px;">
                    <span style="font-size: 12px; font-weight: 800; color: #b91c1c;">RAMO A: O BIPE NÃO PARA COM CARTÃO</span>
                    <span style="background: #fee2e2; color: #991b1b; font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">CARTÃO NÃO LIDO</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10.5px; color: #334155;">
                    <div style="background: #f8fafc; padding: 6px 8px; border-radius: 6px; border-left: 3px solid #004899;">
                        <strong>1. Verificar fixação:</strong> Identificador caiu ou descolou da carenagem/tanque?
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 8px;">
                        <div style="flex: 1; background: #f0fdf4; padding: 6px; border-radius: 6px; border: 1px solid #bbf7d0;">
                            <strong style="color: #166534;">SIM (Leitor caído):</strong><br>Reposicionar no local original e refazer teste. Bipe parou? ➔ <strong>Resolvido!</strong>
                        </div>
                        <div style="flex: 1; background: #fef2f2; padding: 6px; border-radius: 6px; border: 1px solid #fecaca;">
                            <strong style="color: #991b1b;">NÃO (Leitor no local):</strong><br>Caracterizada falha de leitor ➔ Aplicar Perfil Emergencial ➔ <strong>Enviar para Frotas.</strong>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RAMO B: BIPE PARA, SEM DESBLOQUEIO -->
            <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #f1f5f9; pb: 4px;">
                    <span style="font-size: 12px; font-weight: 800; color: #0284c7;">RAMO B: BIPE PARA, MAS NÃO DESBLOQUEIA</span>
                    <span style="background: #e0f2fe; color: #0369a1; font-size: 9.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">LEITURA OK, BLOQUEIO ATIVO</span>
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 10.5px; color: #334155;">
                    <div style="background: #f8fafc; padding: 6px 8px; border-radius: 6px; border-left: 3px solid #0284c7;">
                        <strong>1. Teste de isolamento:</strong> Passar somente o cartão branco (sem celular/crachá).
                    </div>
                    <div style="display: flex; justify-content: space-between; gap: 8px;">
                        <div style="flex: 1; background: #f0f7ff; padding: 6px; border-radius: 6px; border: 1px solid #bae6fd;">
                            <strong style="color: #0369a1;">No Perfil SCUTI:</strong><br>Buscar HEX do cartão no perfil. Se não constar, converter para 1-Wire e atualizar moto.
                        </div>
                        <div style="flex: 1; background: #fffbeb; padding: 6px; border-radius: 6px; border: 1px solid #fde68a;">
                            <strong style="color: #92400e;">No Operacional:</strong><br>Dado Motorista chega? Se não chega, falha no rastreador ➔ Perfil Emergencial ➔ <strong>Frotas.</strong>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 11px; font-weight: 800; color: #0f2e60;">🎯 DESFECHO PADRÃO DE SUCESSO:</span>
            <span style="font-size: 11px; color: #166534; font-weight: 700;">Cartão lido ➔ Luz da injeção / Painel aceso ➔ Bipe cessa ➔ Moto liberada para rota.</span>
        </div>

    </div>
    {footer_html}
</div>

<!-- SLIDE 10: 08 CONTINGÊNCIA & SEGURANÇA OPERACIONAL -->
<div class="slide">
    {render_header("08", "CONTINGÊNCIA & REGRAS DE SEGURANÇA")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Quando todos os testes de identificador e cartão forem esgotados sem sucesso, deve-se adotar o <strong>protocolo de contingência emergencial</strong>.</p>
            
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle" style="background: #dc2626;">!</div>
                    <div class="step-content"><strong>Perfil Padrão Emergencial:</strong> Aplicar exclusivamente o perfil <code>ST4305_ALGAR_FROTA_PADRÃO</code> através do portal SCUTI.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle" style="background: #dc2626;">!</div>
                    <div class="step-content"><strong>Efeito Técnico do Perfil:</strong> Este perfil desativa totalmente o relé de corte da moto, permitindo ligar na chave sem necessidade de aproximação de cartão.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle" style="background: #dc2626;">!</div>
                    <div class="step-content"><strong>Comunicação Obrigatória a Frotas:</strong> Registrar formalmente a placa e encaminhar a moto de imediato para manutenção corretiva.</div>
                </div>
            </div>

            <div class="callout-box alert">
                <div class="callout-icon">🚨</div>
                <div class="callout-text">
                    <strong>REGRA INEGOCIÁVEL SOLAR COCA-COLA:</strong> Nenhuma moto pode permanecer rodando comercialmente no perfil emergencial. O uso é restrito para retorno à base ou deslocamento até a oficina.
                </div>
            </div>
        </div>

        <div class="right-col" style="flex-direction: column; gap: 10px; align-items: stretch; justify-content: center;">
            <div style="background: #f0f7ff; border: 1.5px solid #0284c7; border-radius: 14px; padding: 12px 16px;">
                <h3 style="font-size: 13.5px; font-weight: 900; color: #0c4a6e; margin-bottom: 4px;">🏍️ Procedimento de Substituição (Moto Reserva)</h3>
                <p style="font-size: 11.5px; color: #0369a1; line-height: 1.4;">
                    Ao aplicar o perfil padrão na moto avariada, o supervisor da unidade deve disponibilizar uma <strong>moto reserva cadastrada</strong> para o condutor continuar a rota comercial com pontuação garantida no ranking.
                </p>
            </div>

            <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px 16px;">
                <h3 style="font-size: 13px; font-weight: 800; color: #0f2e60; margin-bottom: 4px;">📞 Canais Oficiais de Suporte Técnico Corpvs</h3>
                <p style="font-size: 11.5px; color: #334155; line-height: 1.4;">
                    📱 <strong>WhatsApp e Telefone de Apoio:</strong> (85) 9 9130-7306<br>
                    ✉️ <strong>E-mail de Atendimento:</strong> clientes.frota@corpvs.com.br<br>
                    🌐 <strong>Plataforma Vanguarda:</strong> corpvs.vanguardatech.com
                </p>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                    <span style="font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 6px; font-weight: 700;">Atendimento 24/7</span>
                    <span style="font-size: 10px; background: #f0fdf4; color: #166534; padding: 3px 8px; border-radius: 6px; font-weight: 700;">Equipe Especializada Solar</span>
                </div>
            </div>
        </div>
    </div>
    {footer_html}
</div>

</body>
</html>
"""

# Write HTML file
with open(HTML_OUTPUT_PATH, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML presentation written to: {HTML_OUTPUT_PATH}")

# Convert to PDF using Chrome Headless
chrome_cmd = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--run-all-compositor-stages-before-draw",
    f'--print-to-pdf={PDF_OUTPUT_PATH}',
    f'file:///{HTML_OUTPUT_PATH}'
]

print("Executing Chrome headless PDF generation...")
result = subprocess.run(chrome_cmd, capture_output=True, text=True)

if PDF_OUTPUT_PATH.exists() and PDF_OUTPUT_PATH.stat().st_size > 0:
    print(f"SUCCESS! Frontend PDF created at: {PDF_OUTPUT_PATH} (Size: {PDF_OUTPUT_PATH.stat().st_size} bytes)")
    # Also copy to backend private documents for authenticated API endpoint
    with open(PDF_OUTPUT_PATH, "rb") as src, open(BACKEND_PDF_PATH, "wb") as dst:
        dst.write(src.read())
    print(f"SUCCESS! Backend PDF copied to: {BACKEND_PDF_PATH} (Size: {BACKEND_PDF_PATH.stat().st_size} bytes)")
else:
    print("FAILED to create PDF! Return code:", result.returncode)
    print("Stdout:", result.stdout)
    print("Stderr:", result.stderr)
