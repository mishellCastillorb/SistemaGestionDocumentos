from django.db import models
from django.contrib.auth.models import AbstractUser


# CATALOGOS

class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return self.nombre


class Area(models.Model):
    nombre = models.CharField(max_length=150, unique=True)
    descripcion = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.nombre


class TipoRegistro(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre


class EstadoExpediente(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre


class MotivoConclusion(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class TipoDocumento(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre


class TipoParticipacion(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre


class TipoMovimiento(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class TipoAcceso(models.Model):
    nombre = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.nombre


# USUARIO

class Usuario(AbstractUser):
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, null=True)
    area = models.ForeignKey(Area, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.username


class PasswordResetRequest(models.Model):
    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    creado_en = models.DateTimeField(auto_now_add=True)
    atendido = models.BooleanField(default=False)

    class Meta:
        ordering = ["-creado_en"]

    def __str__(self):
        estado = "atendido" if self.atendido else "pendiente"
        return f"Solicitud de restablecimiento: {self.usuario.username} ({estado})"


# QUEJAS

class QuejaDenuncia(models.Model):
    folio = models.CharField(max_length=15, unique=True)
    tipo_registro = models.ForeignKey(TipoRegistro, on_delete=models.PROTECT)
    fecha_ingreso = models.DateTimeField(auto_now_add=True)
    asunto = models.CharField(max_length=200)
    descripcion = models.TextField()

    nombre_servidor_publico = models.CharField(max_length=150, blank=True)
    cargo_servidor_publico = models.CharField(max_length=150, blank=True)

    area_involucrada = models.ForeignKey(Area, on_delete=models.SET_NULL, null=True)
    observaciones = models.TextField(blank=True)

    usuario_registra = models.ForeignKey(Usuario, on_delete=models.PROTECT)

    def __str__(self):
        return self.folio

    def save(self, *args, **kwargs):
        if not self.folio:
            folios_numericos = [
                int(queja.folio)
                for queja in QuejaDenuncia.objects.all()
                if queja.folio and queja.folio.isdigit()
            ]

            nuevo_folio = max(folios_numericos, default=0) + 1

            if len(str(nuevo_folio)) > 15:
                raise ValueError(
                    "Se alcanzó el límite máximo de folios de 15 caracteres."
                )

            self.folio = str(nuevo_folio)

        self.folio = self.folio.strip()

        super().save(*args, **kwargs)

# EXPEDIENTES

class Expediente(models.Model):
    numero_expediente = models.CharField(max_length=50, unique=True)
    queja = models.OneToOneField(QuejaDenuncia, on_delete=models.CASCADE)
    estado = models.ForeignKey(EstadoExpediente, on_delete=models.PROTECT)

    fecha_apertura = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    fecha_cierre = models.DateTimeField(null=True, blank=True)

    motivo_conclusion = models.ForeignKey(
        MotivoConclusion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    observaciones_finales = models.TextField(blank=True)

    def __str__(self):
        return self.numero_expediente


# DOCUMENTOS

class Documento(models.Model):
    expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE)
    tipo_documento = models.ForeignKey(TipoDocumento, on_delete=models.PROTECT)

    nombre_documento = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)

    archivo = models.FileField(upload_to="documentos/", null=True, blank=True)

    usuario_registra = models.ForeignKey(Usuario, on_delete=models.PROTECT)

    def __str__(self):
        return self.nombre_documento


# MOVIMIENTOS

class MovimientoExpediente(models.Model):
    expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE)
    tipo_movimiento = models.ForeignKey(TipoMovimiento, on_delete=models.PROTECT)

    fecha = models.DateTimeField(auto_now_add=True)
    descripcion = models.TextField()

    usuario = models.ForeignKey(Usuario, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.expediente}"


# RELACION USUARIOS

class ExpedienteUsuario(models.Model):
    expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    tipo_participacion = models.ForeignKey(TipoParticipacion, on_delete=models.PROTECT)

    fecha_asignacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.usuario} - {self.expediente} ({self.tipo_participacion})"


# ACCESOS

class AccesoExpediente(models.Model):
    expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE)
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE)
    tipo_acceso = models.ForeignKey(TipoAcceso, on_delete=models.PROTECT)

    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.usuario} - {self.expediente} ({self.tipo_acceso})"


class AnalisisDocumento(models.Model):
    ESTADO_PENDIENTE_REVISION = "pendiente_revision"
    ESTADO_ACEPTADO = "aceptado"
    ESTADO_RECHAZADO = "rechazado"
    ESTADO_CORREGIDO = "corregido"
    ESTADO_ERROR = "error"

    ESTADOS_REVISION = [
        (ESTADO_PENDIENTE_REVISION, "Pendiente de revisión"),
        (ESTADO_ACEPTADO, "Aceptado"),
        (ESTADO_RECHAZADO, "Rechazado"),
        (ESTADO_CORREGIDO, "Corregido"),
        (ESTADO_ERROR, "Error en análisis"),
    ]

    METODO_REGLAS = "reglas_v1"
    METODO_IA_EXTERNA = "ia_externa"
    METODO_HIBRIDO = "hibrido"

    METODOS_ANALISIS = [
        (METODO_REGLAS, "Reglas por palabras clave"),
        (METODO_IA_EXTERNA, "IA externa"),
        (METODO_HIBRIDO, "Híbrido"),
    ]

    documento = models.OneToOneField(
        Documento,
        on_delete=models.CASCADE,
        related_name="analisis",
    )

    # Campos actuales. Se mantienen para no romper el flujo existente.
    prioridad = models.CharField(max_length=20)
    categoria = models.CharField(max_length=100)
    palabras_detectadas = models.TextField(blank=True)

    requiere_atencion = models.BooleanField(default=False)

    # Nuevos campos para una sugerencia más profesional.
    justificacion = models.TextField(
        blank=True,
        default="",
        help_text="Explicación breve de por qué se sugirió esta clasificación.",
    )

    texto_extraido = models.TextField(
        blank=True,
        default="",
        help_text="Texto extraído del PDF. En producción debe limitarse según políticas de privacidad.",
    )

    confianza = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="Confianza aproximada del análisis en porcentaje.",
    )

    metodo_analisis = models.CharField(
        max_length=30,
        choices=METODOS_ANALISIS,
        default=METODO_REGLAS,
    )

    version_analizador = models.CharField(
        max_length=20,
        default="1.0",
    )

    error_analisis = models.TextField(
        blank=True,
        default="",
        help_text="Mensaje técnico en caso de que el análisis falle.",
    )

    # Revisión humana. La IA solo sugiere; el usuario decide.
    estado_revision = models.CharField(
        max_length=30,
        choices=ESTADOS_REVISION,
        default=ESTADO_PENDIENTE_REVISION,
    )

    categoria_final = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Clasificación final definida por el usuario revisor.",
    )

    prioridad_final = models.CharField(
        max_length=20,
        blank=True,
        default="",
        help_text="Prioridad final definida por el usuario revisor.",
    )

    comentario_revisor = models.TextField(
        blank=True,
        default="",
    )

    revisado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analisis_documentos_revisados",
    )

    revisado_en = models.DateTimeField(null=True, blank=True)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-creado_en"]
        verbose_name = "Análisis de documento"
        verbose_name_plural = "Análisis de documentos"

    def __str__(self):
        return f"Análisis - {self.documento.nombre_documento}"