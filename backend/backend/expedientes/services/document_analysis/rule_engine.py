import re
import unicodedata
from collections import Counter

from .rules import (
    MAX_CARACTERES_TEXTO_GUARDADO,
    METODO_ANALISIS,
    MIN_CARACTERES_TEXTO_UTIL,
    REGLAS_CLASIFICACION,
    VERSION_ANALIZADOR,
)


def quitar_acentos(texto):
    texto_normalizado = unicodedata.normalize("NFD", texto)

    return "".join(
        caracter
        for caracter in texto_normalizado
        if unicodedata.category(caracter) != "Mn"
    )


def normalizar_texto(texto):
    if not texto:
        return ""

    texto = texto.lower()
    texto = quitar_acentos(texto)
    texto = re.sub(r"\s+", " ", texto)
    texto = texto.strip()

    return texto


def limpiar_texto_extraido(texto):
    if not texto:
        return ""

    texto_limpio = re.sub(r"\s+", " ", texto).strip()

    if len(texto_limpio) <= MAX_CARACTERES_TEXTO_GUARDADO:
        return texto_limpio

    return texto_limpio[:MAX_CARACTERES_TEXTO_GUARDADO].strip() + "..."


def texto_es_util(texto_normalizado):
    """
    Determina si el texto extraído tiene longitud mínima para analizarse.

    Esto evita clasificar documentos escaneados, vacíos o con texto insuficiente.
    """

    return len(texto_normalizado) >= MIN_CARACTERES_TEXTO_UTIL


def generar_resultado_texto_no_util(texto_extraido):
    """
    Resultado controlado cuando no se puede extraer texto útil del PDF.

    No se intenta clasificar el documento, porque podría tratarse de:
    - PDF escaneado como imagen
    - PDF vacío
    - PDF con muy poco texto seleccionable
    """

    return {
        "prioridad": "Media",
        "categoria": "Revisión manual requerida",
        "palabras_detectadas": "",
        "requiere_atencion": True,
        "justificacion": (
            "No se pudo extraer texto útil suficiente del PDF para realizar "
            "una clasificación automática confiable. El documento podría estar "
            "escaneado como imagen, vacío o contener muy poco texto seleccionable. "
            "Se recomienda revisión manual por parte del analista."
        ),
        "texto_extraido": texto_extraido,
        "confianza": 0.00,
        "metodo_analisis": METODO_ANALISIS,
        "version_analizador": VERSION_ANALIZADOR,
        "error_analisis": "",
        "detalle_categorias": [],
    }


def contar_coincidencias(texto_normalizado, palabras_clave):
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


def analizar_por_categorias(texto_normalizado):
    resultados = []

    for regla in REGLAS_CLASIFICACION:
        coincidencias = contar_coincidencias(
            texto_normalizado,
            regla["palabras_clave"],
        )

        total_coincidencias = len(coincidencias)
        palabras_unicas = list(Counter(coincidencias).keys())
        puntaje = total_coincidencias * regla["peso_prioridad"]

        resultados.append(
            {
                "categoria": regla["categoria"],
                "prioridad": regla["prioridad"],
                "peso_prioridad": regla["peso_prioridad"],
                "palabras_detectadas": palabras_unicas,
                "total_coincidencias": total_coincidencias,
                "puntaje": puntaje,
            }
        )

    return resultados


def seleccionar_categoria_sugerida(resultados_por_categoria):
    resultados_con_coincidencias = [
        resultado
        for resultado in resultados_por_categoria
        if resultado["total_coincidencias"] > 0
    ]

    if not resultados_con_coincidencias:
        return {
            "categoria": "General",
            "prioridad": "Baja",
            "peso_prioridad": 0,
            "palabras_detectadas": [],
            "total_coincidencias": 0,
            "puntaje": 0,
        }

    return max(
        resultados_con_coincidencias,
        key=lambda resultado: (
            resultado["peso_prioridad"],
            resultado["total_coincidencias"],
            resultado["puntaje"],
        ),
    )


def formatear_palabras_detectadas(resultados_por_categoria):
    partes = []

    for resultado in resultados_por_categoria:
        if resultado["total_coincidencias"] == 0:
            continue

        palabras = ", ".join(resultado["palabras_detectadas"])
        partes.append(f"{resultado['categoria']}: {palabras}")

    return " | ".join(partes)


def calcular_confianza(categoria_sugerida, resultados_por_categoria, texto_normalizado):
    if not texto_normalizado:
        return 0.00

    if not texto_es_util(texto_normalizado):
        return 0.00

    total_coincidencias_global = sum(
        resultado["total_coincidencias"]
        for resultado in resultados_por_categoria
    )

    if total_coincidencias_global == 0:
        return 40.00

    categorias_con_evidencia = sum(
        1
        for resultado in resultados_por_categoria
        if resultado["total_coincidencias"] > 0
    )

    base = 40
    incremento_prioridad = categoria_sugerida["peso_prioridad"] * 10
    incremento_coincidencias = min(total_coincidencias_global * 5, 30)
    incremento_variedad = min(categorias_con_evidencia * 3, 9)

    confianza = (
        base
        + incremento_prioridad
        + incremento_coincidencias
        + incremento_variedad
    )

    return round(min(confianza, 95), 2)


def generar_resumen_categorias(resultados_por_categoria):
    partes = []

    for resultado in resultados_por_categoria:
        if resultado["total_coincidencias"] == 0:
            continue

        total = resultado["total_coincidencias"]
        categoria = resultado["categoria"]

        if total == 1:
            partes.append(f"1 término asociado a {categoria}")
        else:
            partes.append(f"{total} términos asociados a {categoria}")

    if not partes:
        return ""

    if len(partes) == 1:
        return partes[0]

    return ", ".join(partes[:-1]) + " y " + partes[-1]


def generar_justificacion(
    categoria_sugerida,
    resultados_por_categoria,
    texto_normalizado,
):
    if not texto_normalizado:
        return (
            "No se pudo extraer texto útil del PDF. "
            "El documento podría estar escaneado como imagen o no contener texto seleccionable."
        )

    if not texto_es_util(texto_normalizado):
        return (
            "El texto extraído del PDF es demasiado corto para realizar una "
            "clasificación automática confiable. Se recomienda revisión manual."
        )

    total_coincidencias = sum(
        resultado["total_coincidencias"]
        for resultado in resultados_por_categoria
    )

    if total_coincidencias == 0:
        return (
            "No se detectaron palabras clave asociadas a una queja o denunca grave. "
            "Por ello se sugiere una clasificación general de baja prioridad."
        )

    resumen = generar_resumen_categorias(resultados_por_categoria)
    palabras_sugeridas = ", ".join(
        categoria_sugerida["palabras_detectadas"][:8]
    )

    return (
        f"Se detectaron {resumen}. "
        f"Se priorizó la categoría '{categoria_sugerida['categoria']}' "
        f"con prioridad '{categoria_sugerida['prioridad']}' por su nivel de riesgo "
        f"y por los términos relevantes detectados: {palabras_sugeridas}."
    )
