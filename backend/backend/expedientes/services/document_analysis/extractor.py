import fitz


def extraer_texto_pdf(ruta_pdf):
    """
    Extrae texto de un archivo PDF usando PyMuPDF.

    Importante:
    - Funciona con PDFs que contienen texto seleccionable.
    - No hace OCR.
    - Si el PDF está escaneado como imagen, probablemente regresará texto vacío.
    """

    texto_paginas = []

    with fitz.open(ruta_pdf) as documento_pdf:
        for pagina in documento_pdf:
            texto_pagina = pagina.get_text("text")

            if texto_pagina:
                texto_paginas.append(texto_pagina)

    return "\n".join(texto_paginas).strip()