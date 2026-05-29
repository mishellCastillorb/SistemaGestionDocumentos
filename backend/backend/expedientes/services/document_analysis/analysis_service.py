from .rules import METODO_ANALISIS, VERSION_ANALIZADOR
from .rule_engine import (
    analizar_por_categorias,
    calcular_confianza,
    formatear_palabras_detectadas,
    generar_justificacion,
    generar_resultado_texto_no_util,
    limpiar_texto_extraido,
    normalizar_texto,
    seleccionar_categoria_sugerida,
    texto_es_util,
)


def analizar_texto(texto):
    """
    Analiza el contenido textual de un documento.

    Este análisis es una sugerencia automática basada en reglas.
    No representa una decisión final sobre el expediente.
    """

    texto_normalizado = normalizar_texto(texto)
    texto_extraido = limpiar_texto_extraido(texto)

    if not texto_es_util(texto_normalizado):
        return generar_resultado_texto_no_util(texto_extraido)

    resultados_por_categoria = analizar_por_categorias(texto_normalizado)
    categoria_sugerida = seleccionar_categoria_sugerida(resultados_por_categoria)

    categoria = categoria_sugerida["categoria"]
    prioridad = categoria_sugerida["prioridad"]

    palabras_detectadas = formatear_palabras_detectadas(resultados_por_categoria)

    requiere_atencion = prioridad in ["Alta", "Media"]

    confianza = calcular_confianza(
        categoria_sugerida=categoria_sugerida,
        resultados_por_categoria=resultados_por_categoria,
        texto_normalizado=texto_normalizado,
    )

    justificacion = generar_justificacion(
        categoria_sugerida=categoria_sugerida,
        resultados_por_categoria=resultados_por_categoria,
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
        "detalle_categorias": resultados_por_categoria,
    }