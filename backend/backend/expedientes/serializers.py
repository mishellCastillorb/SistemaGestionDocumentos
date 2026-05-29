from django.contrib.auth import authenticate
from rest_framework import serializers

from backend.expedientes.models import (
    AnalisisDocumento,
    Documento,
    Expediente,
    MovimientoExpediente,
    PasswordResetRequest,
    QuejaDenuncia,
    Usuario,
)


class QuejaDenunciaSerializer(serializers.ModelSerializer):
    tipo_registro_nombre = serializers.StringRelatedField(
        source="tipo_registro",
        read_only=True,
    )

    area_involucrada_nombre = serializers.StringRelatedField(
        source="area_involucrada",
        read_only=True,
    )

    usuario_registra_nombre = serializers.StringRelatedField(
        source="usuario_registra",
        read_only=True,
    )

    expediente_id = serializers.SerializerMethodField()
    expediente_numero = serializers.SerializerMethodField()

    def get_expediente_id(self, obj):
        try:
            return obj.expediente.id
        except Expediente.DoesNotExist:
            return None

    def get_expediente_numero(self, obj):
        try:
            return obj.expediente.numero_expediente
        except Expediente.DoesNotExist:
            return None

    class Meta:
        model = QuejaDenuncia
        fields = [
            "id",
            "folio",
            "tipo_registro",
            "tipo_registro_nombre",
            "fecha_ingreso",
            "asunto",
            "descripcion",
            "nombre_servidor_publico",
            "cargo_servidor_publico",
            "area_involucrada",
            "area_involucrada_nombre",
            "observaciones",
            "usuario_registra",
            "usuario_registra_nombre",
            "expediente_id",
            "expediente_numero",
        ]
        read_only_fields = [
            "usuario_registra",
            "fecha_ingreso",
        ]

    def validate_descripcion(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "La descripción debe tener al menos 10 caracteres."
            )

        return value


class ExpedienteSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(
        source="estado.nombre",
        read_only=True,
    )

    class Meta:
        model = Expediente
        fields = [
            "id",
            "numero_expediente",
            "queja",
            "estado",
            "estado_nombre",
            "fecha_apertura",
            "fecha_actualizacion",
            "fecha_cierre",
            "motivo_conclusion",
            "observaciones_finales",
        ]


class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.StringRelatedField()
    area = serializers.StringRelatedField()

    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "email",
            "rol",
            "area",
        ]


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            username=data["username"],
            password=data["password"],
        )

        if not user:
            raise serializers.ValidationError("Usuario o contraseña incorrectos.")

        if not user.is_active:
            raise serializers.ValidationError("Usuario inactivo.")

        data["user"] = user

        return data


class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    password_nueva = serializers.CharField(write_only=True)

    def validate(self, data):
        user = self.context["request"].user

        if not user.check_password(data["password_actual"]):
            raise serializers.ValidationError(
                "La contraseña actual es incorrecta."
            )

        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    username = serializers.CharField()

    def validate(self, data):
        try:
            Usuario.objects.get(username=data["username"])
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("Usuario no encontrado.")

        return data


class AdministradorPasswordTemporalSerializer(serializers.Serializer):
    usuario_id = serializers.IntegerField()
    password_temporal = serializers.CharField(
        write_only=True,
        min_length=6,
    )

    def validate_password_temporal(self, value):
        if len(value.strip()) < 6:
            raise serializers.ValidationError(
                "La contraseña temporal debe tener al menos 6 caracteres."
            )

        return value


class PasswordResetRequestModelSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)

    class Meta:
        model = PasswordResetRequest
        fields = [
            "id",
            "usuario",
            "creado_en",
            "atendido",
        ]


class AsignarResponsableSerializer(serializers.Serializer):
    usuario_id = serializers.IntegerField()
    tipo_participacion_id = serializers.IntegerField()


class ConcluirExpedienteSerializer(serializers.Serializer):
    motivo_conclusion_id = serializers.IntegerField()
    observaciones_finales = serializers.CharField()


class CambiarEstadoExpedienteSerializer(serializers.Serializer):
    estado_id = serializers.IntegerField()


class AnalisisDocumentoSerializer(serializers.ModelSerializer):
    estado_revision_display = serializers.CharField(
        source="get_estado_revision_display",
        read_only=True,
    )

    metodo_analisis_display = serializers.CharField(
        source="get_metodo_analisis_display",
        read_only=True,
    )

    revisado_por_nombre = serializers.StringRelatedField(
        source="revisado_por",
        read_only=True,
    )

    texto_extraido_preview = serializers.SerializerMethodField()

    class Meta:
        model = AnalisisDocumento
        fields = [
            "id",
            "documento",

            # Resultado principal del análisis
            "prioridad",
            "categoria",
            "palabras_detectadas",
            "requiere_atencion",
            "justificacion",
            "confianza",

            # Información técnica del análisis
            "metodo_analisis",
            "metodo_analisis_display",
            "version_analizador",
            "error_analisis",

            # Texto extraído, pero solo como vista previa
            "texto_extraido_preview",

            # Revisión humana
            "estado_revision",
            "estado_revision_display",
            "categoria_final",
            "prioridad_final",
            "comentario_revisor",
            "revisado_por",
            "revisado_por_nombre",
            "revisado_en",

            # Fechas
            "creado_en",
            "actualizado_en",
        ]

        read_only_fields = [
            "id",
            "documento",
            "prioridad",
            "categoria",
            "palabras_detectadas",
            "requiere_atencion",
            "justificacion",
            "confianza",
            "metodo_analisis",
            "metodo_analisis_display",
            "version_analizador",
            "error_analisis",
            "texto_extraido_preview",
            "estado_revision",
            "estado_revision_display",
            "categoria_final",
            "prioridad_final",
            "comentario_revisor",
            "revisado_por",
            "revisado_por_nombre",
            "revisado_en",
            "creado_en",
            "actualizado_en",
        ]

    def get_texto_extraido_preview(self, obj):
        if not obj.texto_extraido:
            return ""

        limite_caracteres = 500

        if len(obj.texto_extraido) <= limite_caracteres:
            return obj.texto_extraido

        return obj.texto_extraido[:limite_caracteres].strip() + "..."


class DocumentoSerializer(serializers.ModelSerializer):
    tipo_documento_nombre = serializers.StringRelatedField(
        source="tipo_documento",
        read_only=True,
    )

    usuario_registra_nombre = serializers.StringRelatedField(
        source="usuario_registra",
        read_only=True,
    )

    archivo_url = serializers.SerializerMethodField()

    analisis = AnalisisDocumentoSerializer(read_only=True)

    class Meta:
        model = Documento
        fields = [
            "id",
            "expediente",
            "tipo_documento",
            "tipo_documento_nombre",
            "nombre_documento",
            "descripcion",
            "archivo",
            "archivo_url",
            "usuario_registra",
            "usuario_registra_nombre",
            "analisis",
        ]

        read_only_fields = [
            "usuario_registra",
        ]

    def validate_archivo(self, value):
        if value:
            if not value.name.lower().endswith(".pdf"):
                raise serializers.ValidationError(
                    "Solo se permiten archivos PDF."
                )

            if value.content_type != "application/pdf":
                raise serializers.ValidationError(
                    "El archivo debe ser un PDF válido."
                )

        return value

    def get_archivo_url(self, obj):
        request = self.context.get("request")

        if obj.archivo and request:
            return request.build_absolute_uri(obj.archivo.url)

        if obj.archivo:
            return obj.archivo.url

        return None


class RegistrarObservacionSerializer(serializers.Serializer):
    expediente_id = serializers.IntegerField()
    descripcion = serializers.CharField()


class MovimientoExpedienteSerializer(serializers.ModelSerializer):
    tipo_movimiento = serializers.StringRelatedField()
    usuario = serializers.StringRelatedField()

    class Meta:
        model = MovimientoExpediente
        fields = "__all__"
        read_only_fields = [
            "fecha",
            "usuario",
        ]


class RevisionAnalisisDocumentoSerializer(serializers.Serializer):
    comentario_revisor = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )


class CorreccionAnalisisDocumentoSerializer(serializers.Serializer):
    categoria_final = serializers.CharField(max_length=100)

    prioridad_final = serializers.ChoiceField(
        choices=[
            ("Alta", "Alta"),
            ("Media", "Media"),
            ("Baja", "Baja"),
        ]
    )

    comentario_revisor = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
    )

    def validate_categoria_final(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "La categoría final no puede estar vacía."
            )

        return value.strip()