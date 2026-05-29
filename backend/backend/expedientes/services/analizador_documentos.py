import fitz


PALABRAS_ALTAS = [
    "corrupción",
    "soborno",
    "amenaza",
    "violencia",
    "acoso",
    "abuso",
    "dinero",
]

PALABRAS_MEDIAS = [
    "negligencia",
    "incumplimiento",
    "maltrato",
    "hostigamiento",
]


def extraer_texto_pdf(ruta_pdf):
    texto = ""

    documento = fitz.open(ruta_pdf)

    for pagina in documento:
        texto += pagina.get_text()

    return texto.lower()


def analizar_texto(texto):
    palabras_detectadas = []

    for palabra in PALABRAS_ALTAS:
        if palabra in texto:
            palabras_detectadas.append(palabra)

    if palabras_detectadas:
        return {
            "prioridad": "Alta",
            "categoria": "Posible conducta grave",
            "palabras_detectadas": ", ".join(palabras_detectadas),
            "requiere_atencion": True
        }

    palabras_detectadas = []

    for palabra in PALABRAS_MEDIAS:
        if palabra in texto:
            palabras_detectadas.append(palabra)

    if palabras_detectadas:
        return {
            "prioridad": "Media",
            "categoria": "Conducta administrativa",
            "palabras_detectadas": ", ".join(palabras_detectadas),
            "requiere_atencion": False
        }

    return {
        "prioridad": "Baja",
        "categoria": "General",
        "palabras_detectadas": "",
        "requiere_atencion": False
    }
