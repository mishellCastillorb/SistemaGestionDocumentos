"""
Compatibilidad para el resto del sistema.

Antes, views.py importaba desde:
backend.expedientes.services.analizador_documentos

Para no romper ese flujo, este archivo se mantiene como puente hacia
la nueva estructura document_analysis.
"""

from .document_analysis import analizar_texto, extraer_texto_pdf

__all__ = [
    "analizar_texto",
    "extraer_texto_pdf",
]