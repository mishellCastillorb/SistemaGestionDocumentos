import re
from collections import Counter

import fitz


VERSION_ANALIZADOR = "1.1"
METODO_ANALISIS = "reglas_v1"

MAX_CARACTERES_TEXTO_GUARDADO = 5000


REGLAS_CLASIFICACION = [
    {
        "categoria": "Posible conducta grave",
        "prioridad": "Alta",
        "peso_prioridad": 3,
        "palabras_clave": [
            "corrupción",
            "corrupcion",
            "soborno",
            "cohecho",
            "extorsión",
            "extorsion",
            "amenaza",
            "amenazas",
            "violencia",
            "agresión",
            "agresion",
            "abuso",
            "acoso sexual",
            "hostigamiento sexual",
            "discriminación",
            "discriminacion",
            "desvío de recursos",
            "desvio de recursos",
            "malversación",
            "malversacion",
            "fraude",
            "intimidación",
            "intimidacion",
        ],
    },
    {
        "categoria": "Conducta administrativa",
        "prioridad": "Media",
        "peso_prioridad": 2,
        "palabras_clave": [
            "negligencia",
            "incumplimiento",
            "omisión",
            "omision",
            "maltrato",
            "hostigamiento",
            "irregularidad",
            "abuso de autoridad",
            "falta administrativa",
            "trato indebido",
            "retardo",
            "demora",
            "dilación",
            "dilacion",
            "negativa de atención",
            "negativa de atencion",
        ],
    },
    {
        "categoria": "Documento de seguimiento",
        "prioridad": "Baja",
        "peso_prioridad": 1,
        "palabras_clave": [
            "solicitud",
            "seguimiento",
            "respuesta",
            "oficio",
            "anexo",
            "acuse",
            "notificación",
            "notificacion",
            "informe",
            "constancia",
            "evidencia",
            "documentación",
            "documentacion",
        ],
    },
]


def normalizar_texto(texto):
    """
    Limpia el texto extraído para facilitar el análisis por reglas.

    No elimina acentos porque algunas reglas están declaradas con y sin acentos.
    """

    if not texto:
        return ""

    texto = texto.lower()
    texto = re.sub(r"\s+", " ", texto)
    texto = texto.strip()

    return texto


def limpiar_texto_extraido(texto):
    """
    Limpia el texto para almacenarlo o mostrarlo como extracto.

    Se limita el tamaño para evitar guardar documentos completos muy grandes.
    """

    if not texto:
        return ""

    texto_limpio = re.sub(r"\s+", " ", texto).strip()

    if len(texto_limpio) <= MAX_CARACTERES_TEXTO_GUARDADO:
        return texto_limpio

    return texto_limpio[:MAX_CARACTERES_TEXTO_GUARDADO].strip() + "..."


def extraer_texto_pdf(ruta_pdf):
    """
    Extrae texto de un archivo PDF usando PyMuPDF.

    Nota:
    - Funciona bien con PDFs que ya contienen texto seleccionable.
    - No hace OCR, por lo que un PDF escaneado como imagen puede regresar
      poco texto o texto vacío.
    """

    texto_paginas = []

    with fitz.open(ruta_pdf) as documento_pdf:
        for numero_pagina, pagina in enumerate(documento_pdf, start=1):
            texto_pagina = pagina.get_text("text")

            if texto_pagina:
                texto_paginas.append(texto_pagina)

    return "\n".join(texto_paginas).strip()


def contar_coincidencias(texto_normalizado, palabras_clave):
    """
    Cuenta cuántas palabras clave aparecen en el texto.

    Para frases con espacios, usa búsqueda directa.
    Para palabras individuales, usa una búsqueda con límites de palabra.
    """

    coincidencias = []

    for palabra in palabras_clave:
        palabra_normalizada = normalizar_texto(palabra)

        if not palabra_normalizada:
            continue

        if " " in palabra_normalizada:
            ocurrencias = texto_normalizado.count(palabra_normalizada)
        else:
            patron = rf"\b{re.escape(palabra_normalizada)}\b"
            ocurrencias = len(re.findall(patron, texto_normalizado))

        if ocurrencias > 0:
            coincidencias.extend([palabra] * ocurrencias)

    return coincidencias


def obtener_resultado_por_reglas(texto_normalizado):
    """
    Evalúa el texto contra las reglas configuradas en código.

    Regresa:
    - categoría sugerida
    - prioridad sugerida
    - palabras detectadas
    - nivel de prioridad interno
    """

    mejor_resultado = {
        "categoria": "General",
        "prioridad": "Baja",
        "peso_prioridad": 0,
        "palabras_detectadas": [],
    }

    for regla in REGLAS_CLASIFICACION:
        coincidencias = contar_coincidencias(
            texto_normalizado,
            regla["palabras_clave"],
        )

        if not coincidencias:
            continue

        peso_actual = regla["peso_prioridad"]
        total_actual = len(coincidencias)

        peso_mejor = mejor_resultado["peso_prioridad"]
        total_mejor = len(mejor_resultado["palabras_detectadas"])

        if peso_actual > peso_mejor or (
            peso_actual == peso_mejor and total_actual > total_mejor
        ):
            mejor_resultado = {
                "categoria": regla["categoria"],
                "prioridad": regla["prioridad"],
                "peso_prioridad": peso_actual,
                "palabras_detectadas": coincidencias,
            }

    return mejor_resultado


def calcular_confianza(peso_prioridad, total_palabras_detectadas, texto_normalizado):
    """
    Calcula una confianza aproximada para el análisis por reglas.

    No es probabilidad real de IA; es un indicador práctico basado en:
    - número de coincidencias
    - gravedad de la categoría detectada
    - existencia de texto útil
    """

    if not texto_normalizado:
        return 0.00

    if total_palabras_detectadas == 0:
        return 40.00

    base = 45
    incremento_por_prioridad = peso_prioridad * 10
    incremento_por_coincidencias = min(total_palabras_detectadas * 5, 25)

    confianza = base + incremento_por_prioridad + incremento_por_coincidencias

    return round(min(confianza, 95), 2)


def generar_justificacion(categoria, prioridad, palabras_detectadas, texto_normalizado):
    """
    Genera una justificación breve y entendible para el usuario analista.
    """

    if not texto_normalizado:
        return (
            "No se pudo extraer texto útil del PDF. "
            "El documento podría estar escaneado como imagen o no contener texto seleccionable."
        )

    if not palabras_detectadas:
        return (
            "No se detectaron palabras clave asociadas a una queja o denuncia grave. "
            "Por ello se sugiere una clasificación general de baja prioridad."
        )

    contador = Counter(palabras_detectadas)
    palabras_unicas = list(contador.keys())
    palabras_resumen = ", ".join(palabras_unicas[:8])

    return (
        f"Se sugiere la categoría '{categoria}' con prioridad '{prioridad}' "
        f"porque se detectaron términos relevantes en el documento: {palabras_resumen}."
    )


def analizar_texto(texto):
    """
    Analiza el contenido textual de un documento.

    Este análisis es una sugerencia automática basada en reglas.
    No representa una decisión final sobre el expediente.
    """

    texto_normalizado = normalizar_texto(texto)
    texto_extraido = limpiar_texto_extraido(texto)

    resultado_reglas = obtener_resultado_por_reglas(texto_normalizado)

    categoria = resultado_reglas["categoria"]
    prioridad = resultado_reglas["prioridad"]
    peso_prioridad = resultado_reglas["peso_prioridad"]
    palabras_detectadas_lista = resultado_reglas["palabras_detectadas"]

    palabras_unicas = list(Counter(palabras_detectadas_lista).keys())
    palabras_detectadas = ", ".join(palabras_unicas)

    requiere_atencion = prioridad in ["Alta", "Media"]

    confianza = calcular_confianza(
        peso_prioridad=peso_prioridad,
        total_palabras_detectadas=len(palabras_detectadas_lista),
        texto_normalizado=texto_normalizado,
    )

    justificacion = generar_justificacion(
        categoria=categoria,
        prioridad=prioridad,
        palabras_detectadas=palabras_detectadas_lista,
        texto_normalizado=texto_normalizado,
    )

    return {
        "prioridad": prioridad,
        "categoria": categoria,
        "palabras_detectadas": palabras_detectadas,
        "requiere_atencion": requiere_atencion,
        "justificacion": justificacion,
        "texto_extraido": texto_extraido,
        "confianza": confianza,
        "metodo_analisis": METODO_ANALISIS,
        "version_analizador": VERSION_ANALIZADOR,
        "error_analisis": "",
    }