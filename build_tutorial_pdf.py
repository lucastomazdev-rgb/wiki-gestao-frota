import os
import re
import base64
import subprocess
from pathlib import Path

# Paths
WORKSPACE_ROOT = Path(r"c:\Users\Corpvs\Documents\Wiki Gestao Frota\wiki-gestao-frota")
IMAGES_DIR = WORKSPACE_ROOT / "frontend" / "public" / "images" / "tutorial_vanguarda"
DOCUMENTS_DIR = WORKSPACE_ROOT / "frontend" / "public" / "documents"
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
PDF_OUTPUT_PATH = DOCUMENTS_DIR / "treinamento_vanguarda.pdf"
HTML_OUTPUT_PATH = WORKSPACE_ROOT / "temp_tutorial_presentation.html"

# Helper to get base64 data URI of images
def get_image_base64(filename):
    p = IMAGES_DIR / filename
    if not p.exists():
        print(f"Warning: {filename} not found!")
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

# Extract base64 logo from LOGOELETRONICACIRCLE.svg if possible
logo_svg_path = WORKSPACE_ROOT / "frontend" / "public" / "images" / "LOGOELETRONICACIRCLE.svg"
logo_symbol_b64 = ""
if logo_svg_path.exists():
    with open(logo_svg_path, "r", encoding="utf-8") as f:
        svg_content = f.read()
    match = re.search(r'data:image/png;base64,([^\"]+)', svg_content)
    if match:
        logo_symbol_b64 = f"data:image/png;base64,{match.group(1)}"

# Load all tutorial images
img_operacional = get_image_base64("foto_operacional.png")
img_cards = get_image_base64("foto_cards.png")
img_comunicacao = get_image_base64("foto_comunicacao.png")
img_pic1 = get_image_base64("picture1_paineltelemetria.png")
img_filtro_telemetria = get_image_base64("foto_filtro_telemetria.png")
img_pic2 = get_image_base64("picture2_paineltelemetria.png")
img_pic3 = get_image_base64("picture3_paineltelemetria.png")
img_pic4 = get_image_base64("picture4_paineltelemetria.png")
img_pic5 = get_image_base64("picture5_paineltelemetria.png")
img_pic6 = get_image_base64("picture6_paineltelemetria.png")
img_alertas = get_image_base64("foto_alertas.png")
img_rel_posicao = get_image_base64("foto_relatorio_posicao.png")
img_auditoria_posicao = get_image_base64("foto_auditoria_posicao.png")

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
<title>Treinamento Vanguarda - Manual Operacional</title>
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
    grid-template-columns: 37% 63%;
    gap: 18px;
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
.callout-text {{
    font-size: 11.5px;
    color: #0c4a6e;
    line-height: 1.35;
}}
.callout-text strong {{
    color: #0284c7;
    font-weight: 700;
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
.stacked-image-grid {{
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    height: 100%;
    max-height: 140mm;
}}
.stacked-image-frame {{
    flex: 1;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    box-shadow: 0 6px 16px rgba(15, 46, 96, 0.12);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}}
.stacked-image-frame img {{
    width: 100%;
    height: 100%;
    object-fit: contain;
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
    width: 62%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-top: 10mm;
    padding-bottom: 6mm;
}}
.cover-titles {{
    display: flex;
    flex-direction: column;
    gap: 0px;
    margin-top: 15mm;
}}
.cover-title-guia {{
    font-size: 42px;
    font-weight: 900;
    color: #0f2e60;
    letter-spacing: 0.05em;
    line-height: 1;
}}
.cover-title-operacional {{
    font-size: 68px;
    font-weight: 900;
    color: #0f2e60;
    letter-spacing: 0.02em;
    line-height: 1.05;
}}
.cover-title-de {{
    font-size: 26px;
    font-weight: 800;
    color: #004899;
    letter-spacing: 0.08em;
    margin-top: 4px;
}}
.cover-title-main {{
    font-size: 48px;
    font-weight: 900;
    color: #004899;
    letter-spacing: 0.02em;
    line-height: 1.1;
}}
.cover-subtitle {{
    font-size: 15px;
    font-weight: 700;
    color: #475569;
    letter-spacing: 0.06em;
    margin-top: 16px;
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
    margin-top: 20mm;
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
.cover-watermark {{
    position: absolute;
    top: 15mm;
    left: 42%;
    width: 90mm;
    height: 90mm;
    opacity: 0.04;
    pointer-events: none;
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
    padding: 18px 22px;
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    padding: 4px 0;
}}
.summary-badge {{
    width: 32px;
    height: 26px;
    background: #004899;
    color: #ffffff;
    font-size: 13px;
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
    font-size: 12px;
    font-weight: 800;
    color: #0f2e60;
}}
.summary-item-desc {{
    font-size: 10.5px;
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
.color-badge {{
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 5px;
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
                <span class="cover-title-main">TREINAMENTO VANGUARDA.</span>
                <span class="cover-subtitle">OPERAÇÕES BÁSICAS, TELEMETRIA E AUDITORIA DE EVENTOS</span>
                <div class="cover-tag">
                    <span>🏢</span> OPERAÇÃO SOLAR COCA-COLA
                </div>
            </div>

            <div class="cover-features-row">
                <div class="feature-pill">
                    <div class="feature-icon-box">🌐</div>
                    <div class="feature-pill-text">Acesse com<br>segurança.</div>
                </div>
                <div class="feature-pill">
                    <div class="feature-icon-box">📡</div>
                    <div class="feature-pill-text">Monitore em<br>tempo real.</div>
                </div>
                <div class="feature-pill">
                    <div class="feature-icon-box">📊</div>
                    <div class="feature-pill-text">Audite e resolva<br>com eficiência.</div>
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
                <h1 style="font-size: 32px; font-weight: 900; color: #0f2e60; text-transform: uppercase;">INTRODUÇÃO</h1>
                <div class="header-blue-line" style="width: 110px; height: 3.5px;"></div>
            </div>
            <div class="intro-text-block">
                <p>Este guia apresenta as principais funcionalidades e procedimentos da plataforma <strong>Vanguarda</strong>, desenvolvida para a gestão, rastreamento e telemetria da frota da <strong>Solar Coca-Cola</strong>.</p>
                <p>O conteúdo foi estruturado em módulos didáticos, desde a navegação na tela operacional até a auditoria minuciosa de eventos de telemetria, tratativas de infrações e fluxos de suporte via chamados SD.</p>
                <p>O objetivo deste material é <strong>padronizar os processos operacionais</strong>, capacitar supervisores e gestores de frota, garantir a integridade das notas de condução e apoiar no acompanhamento diário dos condutores.</p>
            </div>
        </div>

        <div class="right-col">
            <div class="summary-card">
                <div class="summary-card-header">
                    <div class="summary-header-icon">📖</div>
                    <span class="summary-card-title">NESTE GUIA, VOCÊ ENCONTRARÁ:</span>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">01</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">ACESSO & ABA OPERACIONAL</span>
                        <span class="summary-item-desc">Login, visualização do mapa em tempo real e filtros de busca da frota.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">02</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">CARDS & CONECTIVIDADE</span>
                        <span class="summary-item-desc">Status de ignição, alertas, GPS vs. GPRS e áreas de sombra telemétrica.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">03</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">STATUS POR CORES</span>
                        <span class="summary-item-desc">Faixas de comunicação e rotina proativa da Corpvs para veículos +24h.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">04</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">PAINEL DE TELEMETRIA</span>
                        <span class="summary-item-desc">Acesso e parâmetros de consulta por unidade, equipe e tipo de veículo.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">05</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">PILARES DE CONDUÇÃO</span>
                        <span class="summary-item-desc">Critérios de avaliação para frota de Motos (3 pilares) e Pesados (4 pilares).</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">06</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">PAINEL DO MOTORISTA</span>
                        <span class="summary-item-desc">Consulta individual de notas, sub-abas de infrações, feedbacks e viagens.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">07</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">AUDITORIA DE ALERTAS & POSIÇÕES</span>
                        <span class="summary-item-desc">Validação de tolerância de eventos e contraprova com coluna de RPM.</span>
                    </div>
                </div>
                <div class="summary-item-row">
                    <div class="summary-badge">08</div>
                    <div class="summary-item-info">
                        <span class="summary-item-name">CHAMADOS SD & APP MOBILE</span>
                        <span class="summary-item-desc">Fluxo formal para contestação, cadastro de usuários e acesso do motorista.</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 3: 01 ACESSO AO SISTEMA & ABA OPERACIONAL -->
<div class="slide">
    {render_header("01", "ACESSO AO SISTEMA & ABA OPERACIONAL")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Ao entrar na plataforma Vanguarda com suas credenciais de acesso, você é automaticamente direcionado para o módulo <strong>Operacional</strong>.</p>
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle">1</div>
                    <div class="step-content"><strong>Endereço de Acesso:</strong> Acesse o portal oficial em <code>https://corpvs.vanguardatech.com</code> e insira suas credenciais.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">2</div>
                    <div class="step-content"><strong>Ícone do Globo (Sidebar):</strong> Sinalizado pelo número <strong>1</strong> na barra lateral, ele sempre retorna para a tela principal operacional.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">3</div>
                    <div class="step-content"><strong>Mapa em Tempo Real:</strong> A porção direita da tela exibe a localização física e o status instantâneo de cada veículo da frota.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">4</div>
                    <div class="step-content"><strong>Coluna de Busca Rápida:</strong> À esquerda, use os filtros dinâmicos de <strong>Unidade</strong>, <strong>Grupo de Veículo</strong>, <strong>Veículo (Placa)</strong> e <strong>Motorista</strong> para localizar frotas específicas com agilidade.</div>
                </div>
            </div>
            <div class="callout-box">
                <div class="callout-icon">!</div>
                <div class="callout-text"><strong>Dica Operacional:</strong> Caso queira consultar uma placa específica, basta digitá-la diretamente no campo "Veículo" para focar o mapa automaticamente.</div>
            </div>
        </div>

        <div class="right-col">
            <div class="image-frame">
                <img src="{img_operacional}" alt="Tela Principal do Operacional" />
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 4: 02 ESTRUTURA DOS CARDS & CONECTIVIDADE -->
<div class="slide">
    {render_header("02", "ESTRUTURA DOS CARDS & CONECTIVIDADE")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Na coluna da esquerda, cada veículo possui um <strong>card de identificação</strong> contendo status elétrico, telemetria e dados de transmissão:</p>
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle">1</div>
                    <div class="step-content"><strong>Status de Ignição:</strong> O ícone de chave fica <strong>aceso</strong> quando o veículo está ligado e <strong>apagado</strong> com ignição desligada.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">2</div>
                    <div class="step-content"><strong>Ícone de Alertas:</strong> O símbolo de exclamação permite visualizar os alertas recentes registrados para o veículo.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">3</div>
                    <div class="step-content"><strong>Data GPS vs. Data GPRS:</strong> GPRS é o envio do chip GSM; GPS é a posição do satélite. Em condições normais, são idênticas.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">4</div>
                    <div class="step-content"><strong>Áreas de Sombra:</strong> Sem sinal celular, o rastreador guarda pontos e alertas na <strong>memória interna</strong> e descarrega tudo ao reconectar. O veículo não fica sem rastreio!</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">5</div>
                    <div class="step-content"><strong>Motorista & Bateria:</strong> Exibe o nome do condutor (ou número do cartão não associado), velocidade e tensão da bateria.</div>
                </div>
            </div>
            <div class="callout-box">
                <div class="callout-icon">!</div>
                <div class="callout-text"><strong>Atenção:</strong> Cartão exibindo apenas numeração indica falta de associação cadastral. Acione a Corpvs para vincular o motorista ao cartão.</div>
            </div>
        </div>

        <div class="right-col">
            <div class="image-frame">
                <img src="{img_cards}" alt="Cards de Veículos" />
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 5: 03 STATUS DE COMUNICAÇÃO POR CORES -->
<div class="slide">
    {render_header("03", "STATUS DE COMUNICAÇÃO POR CORES")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Os blocos coloridos no topo categorizam a pontualidade da última transmissão de cada veículo para controle rigoroso da operação:</p>
            <table class="custom-table">
                <thead>
                    <tr>
                        <th>Cor</th>
                        <th>Faixa de Tempo</th>
                        <th>Situação Operacional</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Azul</strong></td>
                        <td>Todos os Veículos</td>
                        <td>Volume total da frota na unidade.</td>
                    </tr>
                    <tr>
                        <td><strong>Verde</strong></td>
                        <td>0 min a 10 min</td>
                        <td>Transmitindo ativamente; em rota ou recém-parado.</td>
                    </tr>
                    <tr>
                        <td><strong>Amarelo</strong></td>
                        <td>10 min a 45 min</td>
                        <td>Parado em descarga, abastecimento ou refeição.</td>
                    </tr>
                    <tr>
                        <td><strong>Vermelho</strong></td>
                        <td>45 min a 24 horas</td>
                        <td>Ligado para recarga ou movimentações curtas de pátio.</td>
                    </tr>
                    <tr>
                        <td><strong>Cinza</strong></td>
                        <td>Acima de 24 horas</td>
                        <td>Inativo, sem transmissão ou retido em oficina mecânica.</td>
                    </tr>
                </tbody>
            </table>
            <div class="callout-box" style="margin-top: 8px;">
                <div class="callout-icon">!</div>
                <div class="callout-text"><strong>Acompanhamento Proativo Corpvs:</strong> A Corpvs contata proativamente os responsáveis da filial para verificar veículos na faixa <strong>Cinza (+24h)</strong> e corrigir atrasos técnicos.</div>
            </div>
        </div>

        <div class="right-col">
            <div class="image-frame">
                <img src="{img_comunicacao}" alt="Status de Comunicação por Cores" />
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 6: 04 PAINEL DE TELEMETRIA & FILTROS -->
<div class="slide">
    {render_header("04", "PAINEL DE TELEMETRIA & FILTROS")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">O Painel de Telemetria centraliza o acompanhamento de notas, ranking e auditoria das infrações de condução:</p>
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle">1</div>
                    <div class="step-content"><strong>Como Acessar:</strong> Na barra lateral, clique no <strong>ícone da Solar</strong> e selecione a opção <strong>Painel de Telemetria</strong>.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">2</div>
                    <div class="step-content"><strong>Cliente (Obrigatório):</strong> Selecione a base ou unidade operacional desejada.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">3</div>
                    <div class="step-content"><strong>Equipe (Opcional):</strong> Preenchido exibe os motoristas e média da equipe; em branco carrega todas as equipes e a média geral.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">4</div>
                    <div class="step-content"><strong>Período & Tipo de Veículo:</strong> Escolha as datas da apuração e a categoria entre <strong>Pesados (Caminhões)</strong> ou <strong>Motos</strong>.</div>
                </div>
            </div>
        </div>

        <div class="right-col">
            <div class="stacked-image-grid">
                <div class="stacked-image-frame" style="flex: 0.35;">
                    <img src="{img_pic1}" alt="Acesso Painel Telemetria" />
                </div>
                <div class="stacked-image-frame" style="flex: 0.65;">
                    <img src="{img_filtro_telemetria}" alt="Filtros de Telemetria" />
                </div>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 7: 05 PILARES DE CONDUÇÃO E EVENTOS -->
<div class="slide">
    {render_header("05", "PILARES DE CONDUÇÃO E EVENTOS")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Ao pesquisar, o card <strong>Avaliação Geral</strong> apresenta a média consolidada e o detalhamento por pilares operacionais:</p>
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle">🏍️</div>
                    <div class="step-content"><strong>Frota de Motos (3 Pilares):</strong><br>
                    • <strong>Manutenção:</strong> Checklist não realizado.<br>
                    • <strong>Segurança:</strong> Aceleração, Curva Brusca e Excesso de Velocidade.<br>
                    • <strong>Jornada:</strong> Movimentação em horário indevido.<br>
                    <em>*Apenas severidade média e alta pontuam; leve é educativo.</em></div>
                </div>
                <div class="step-item">
                    <div class="num-circle">🚚</div>
                    <div class="step-content"><strong>Frota de Pesados / Caminhões (4 Pilares):</strong><br>
                    • <strong>Segurança:</strong> Aceleração e Curva Brusca, Velocidade Máxima.<br>
                    • <strong>Performance:</strong> Faixa Amarela, Vermelha, Parado Ligado.<br>
                    • <strong>Manutenção:</strong> Checklist não realizado.<br>
                    • <strong>VídeoTelemetria:</strong> Fadiga, Distração, Cinto, Celular, etc.</div>
                </div>
            </div>
            <div class="callout-box">
                <div class="callout-icon">!</div>
                <div class="callout-text"><strong>Regra de Equidade de Pesados:</strong> Apenas 3 pilares entram na nota geral. VídeoTelemetria fica temporariamente de fora por equidade com veículos sem câmeras.</div>
            </div>
        </div>

        <div class="right-col">
            <div class="image-frame">
                <img src="{img_pic2}" alt="Card Avaliação Geral e Pilares" />
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 8: 06 COMPARATIVO & PAINEL DO MOTORISTA -->
<div class="slide">
    {render_header("06", "COMPARATIVO & PAINEL DO MOTORISTA")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Todos os condutores iniciam a jornada com <strong>Nota 100</strong> e sofrem deduções conforme cometem infrações telemétricas:</p>
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle">1</div>
                    <div class="step-content"><strong>Comparativo de Pontuação:</strong> Ao clicar em qualquer pilar, o sistema abre a lista em <strong>ordem decrescente</strong> (da maior para a menor nota).</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">2</div>
                    <div class="step-content"><strong>Acesso ao Condutor:</strong> Clique no <strong>nome do condutor</strong> para abrir uma nova aba com o <strong>Painel do Motorista</strong>.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">3</div>
                    <div class="step-content"><strong>Carregamento Automático:</strong> Os filtros são carregados preenchidos com os dados do motorista, média individual e sub-abas operacionais.</div>
                </div>
            </div>
            <div class="callout-box">
                <div class="callout-icon">!</div>
                <div class="callout-text"><strong>Gestão Focada:</strong> O comparativo permite ao supervisor identificar rapidamente quem necessita de orientação e quem é destaque positivo no mês.</div>
            </div>
        </div>

        <div class="right-col">
            <div class="stacked-image-grid">
                <div class="stacked-image-frame" style="flex: 0.45;">
                    <img src="{img_pic3}" alt="Comparativo de Pontuação" />
                </div>
                <div class="stacked-image-frame" style="flex: 0.55;">
                    <img src="{img_pic4}" alt="Painel do Motorista" />
                </div>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 9: 07 GESTÃO DE INFRAÇÕES & AÇÕES EDUCATIVAS -->
<div class="slide">
    {render_header("07", "GESTÃO DE INFRAÇÕES & AÇÕES EDUCATIVAS")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">O card <strong>Detalhes da Operação</strong> possui 3 sub-abas essenciais para auditoria e tratativas pelo supervisor de equipe:</p>
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle">1</div>
                    <div class="step-content"><strong>Sub-aba "Infrações":</strong> Lista todos os eventos. Marque a caixa de seleção e clique em <strong>"Adicionar Feedback"</strong> para registrar a tratativa formal com o colaborador.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">2</div>
                    <div class="step-content"><strong>Auditoria no Menu ("..."):</strong> Clique nos três pontos da infração e selecione <strong>Visualizar</strong> para inspecionar o mapa e o momento exato do alerta.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">3</div>
                    <div class="step-content"><strong>Ações Educacionais & Elogios:</strong> Consulte feedbacks aplicados e registre <strong>Elogios</strong> para motoristas de boa conduta.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">4</div>
                    <div class="step-content"><strong>Detalhamento por Pilar:</strong> No rodapé, visualize a nota individual e a quantidade exata de cada infração (ex: 15 checklists não feitos).</div>
                </div>
            </div>
        </div>

        <div class="right-col">
            <div class="stacked-image-grid">
                <div class="stacked-image-frame" style="flex: 0.45;">
                    <img src="{img_pic5}" alt="Visualizar Infração Três Pontos" />
                </div>
                <div class="stacked-image-frame" style="flex: 0.55;">
                    <img src="{img_pic6}" alt="Notas por Pilar e Ocorrências" />
                </div>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 10: 08 AUDITORIA TÉCNICA: ALERTAS & POSIÇÕES -->
<div class="slide">
    {render_header("08", "AUDITORIA TÉCNICA: ALERTAS & POSIÇÕES")}
    <div class="slide-body-grid">
        <div class="left-col">
            <p class="step-intro">Para validar a legitimidade de uma autuação (ex: <strong>Faixa Amarela de RPM</strong>), executamos a contraprova técnica:</p>
            <div class="step-list">
                <div class="step-item">
                    <div class="num-circle">1</div>
                    <div class="step-content"><strong>Tela de Alertas:</strong> Ao clicar em "Visualizar", a tela traz data, hora, placa, velocidade e duração (ex: 4s acima de 2.000 RPM).</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">2</div>
                    <div class="step-content"><strong>Interpretação da Tolerância:</strong> O alerta exige &gt;15s de tolerância. Duração de 4s confirma 15s + 4s = 19 segundos acima de 2.000 RPM.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">3</div>
                    <div class="step-content"><strong>Relatório de Posições:</strong> Aplique os mesmos filtros de veículo e horário. No ícone de pirâmide/funil, <strong>habilite a coluna "RPM"</strong>.</div>
                </div>
                <div class="step-item">
                    <div class="num-circle">4</div>
                    <div class="step-content"><strong>Contraprova Conclusiva:</strong> No exemplo, às 09:25:50 o motorista já registrava RPM &gt;2000, comprovando o alerta disparado às 09:26:07.</div>
                </div>
            </div>
        </div>

        <div class="right-col">
            <div class="stacked-image-grid">
                <div class="stacked-image-frame" style="flex: 0.45;">
                    <img src="{img_alertas}" alt="Tela de Alertas e Notificações" />
                </div>
                <div class="stacked-image-frame" style="flex: 0.55;">
                    <img src="{img_auditoria_posicao}" alt="Relatório de Posições com RPM" />
                </div>
            </div>
        </div>
    </div>
    {footer_html}
</div>

<!-- SLIDE 11: 09 CHAMADOS SD, APP MOBILE & SUPORTE -->
<div class="slide">
    {render_header("09", "CHAMADOS SD, APP MOBILE & SUPORTE")}
    <div class="slide-body-grid" style="grid-template-columns: 48% 52%;">
        <div class="left-col">
            <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; margin-bottom: 8px;">
                <h3 style="font-size: 13px; font-weight: 800; color: #0f2e60; margin-bottom: 4px;">🛠️ Contestação & Restituição de Pontuação</h3>
                <p style="font-size: 11px; color: #334155; line-height: 1.35;">Se for verificada uma inconsistência técnica no evento, abra um <strong>chamado SD para a Solar Coca-Cola</strong>. A Corpvs audita os logs brutos e, comprovada a falha, apaga o alerta e <strong>restitui integralmente a nota</strong> do condutor.</p>
            </div>

            <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px 14px;">
                <h3 style="font-size: 13px; font-weight: 800; color: #0f2e60; margin-bottom: 4px;">👥 Solicitação de Novos Acessos via SD</h3>
                <p style="font-size: 11px; color: #334155; line-height: 1.35;">
                    <strong>Supervisor:</strong> Nome completo, e-mail corporativo, CPF, cargo e matrícula.<br>
                    <strong>Condutor:</strong> Nome completo, CPF, matrícula, número do cartão RFID/I-Button, dados da CNH, supervisão e categoria (Moto ou Pesados).
                </p>
            </div>
        </div>

        <div class="right-col" style="flex-direction: column; gap: 10px;">
            <div style="width: 100%; background: #f0f7ff; border: 1.5px solid #0284c7; border-radius: 14px; padding: 12px 16px;">
                <h3 style="font-size: 13.5px; font-weight: 900; color: #0c4a6e; margin-bottom: 4px;">📱 Padrão de Login no Aplicativo do Motorista</h3>
                <p style="font-size: 11.5px; color: #0369a1; line-height: 1.4;">
                    <strong>Usuário / Login:</strong> <code>CPF@app.com.br</code> (apenas números)<br>
                    <strong>Senha Inicial:</strong> <code>CPF</code> (apenas números do CPF)
                </p>
                <div style="display: flex; gap: 10px; margin-top: 8px;">
                    <span style="font-size: 10.5px; background: #ffffff; border: 1px solid #bae6fd; padding: 4px 8px; border-radius: 6px; color: #0284c7; font-weight: 700;">Google Play (Android)</span>
                    <span style="font-size: 10.5px; background: #ffffff; border: 1px solid #bae6fd; padding: 4px 8px; border-radius: 6px; color: #0284c7; font-weight: 700;">App Store (iOS)</span>
                </div>
            </div>

            <div style="width: 100%; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 12px 16px;">
                <h3 style="font-size: 13px; font-weight: 800; color: #0f2e60; margin-bottom: 4px;">📞 Canais de Atendimento Corpvs</h3>
                <p style="font-size: 11.5px; color: #334155; line-height: 1.4;">
                    📱 <strong>WhatsApp / Telefone:</strong> (85) 9 9130-7306<br>
                    ✉️ <strong>E-mail de Suporte:</strong> clientes.frota@corpvs.com.br
                </p>
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
    print(f"SUCCESS! PDF created at: {PDF_OUTPUT_PATH} (Size: {PDF_OUTPUT_PATH.stat().st_size} bytes)")
else:
    print("FAILED to create PDF! Return code:", result.returncode)
    print("Stdout:", result.stdout)
    print("Stderr:", result.stderr)
