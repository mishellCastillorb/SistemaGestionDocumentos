from rest_framework import serializers
from backend.expedientes.models import QuejaDenuncia, Expediente, Documento, MovimientoExpediente
from django.contrib.auth import authenticate
from backend.expedientes.models import Usuario


class QuejaDenunciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuejaDenuncia
        fields = '__all__'
        read_only_fields = ['usuario_registra', 'fecha_ingreso']

    def validate_descripcion(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("La descripción debe tener al menos 10 caracteres.")
        return value

class ExpedienteSerializer(serializers.ModelSerializer):
    estado_nombre = serializers.CharField(source='estado.nombre', read_only=True)

    class Meta:
        model = Expediente
        fields = [
            'id',
            'numero_expediente',
            'queja',
            'estado',
            'estado_nombre',
            'fecha_apertura',
            'fecha_actualizacion',
            'fecha_cierre',
            'motivo_conclusion',
            'observaciones_finales',
        ]

class UsuarioSerializer(serializers.ModelSerializer):
    rol = serializers.StringRelatedField()
    area = serializers.StringRelatedField()

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'rol', 'area']

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            username=data['username'],
            password=data['password']
        )

        if not user:
            raise serializers.ValidationError("Usuario o contraseña incorrectos.")

        if not user.is_active:
            raise serializers.ValidationError("Usuario inactivo.")

        data['user'] = user
        return data

class CambiarPasswordSerializer(serializers.Serializer):
    password_actual = serializers.CharField(write_only=True)
    password_nueva = serializers.CharField(write_only=True)

    def validate(self, data):
        user = self.context['request'].user

        if not user.check_password(data['password_actual']):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")

        return data

class AsignarResponsableSerializer(serializers.Serializer):
    usuario_id = serializers.IntegerField()
    tipo_participacion_id = serializers.IntegerField()


class ConcluirExpedienteSerializer(serializers.Serializer):
    motivo_conclusion_id = serializers.IntegerField()
    observaciones_finales = serializers.CharField()

class CambiarEstadoExpedienteSerializer(serializers.Serializer):
    estado_id = serializers.IntegerField()

class DocumentoSerializer(serializers.ModelSerializer):
    tipo_documento_nombre = serializers.StringRelatedField(source='tipo_documento', read_only=True)
    usuario_registra_nombre = serializers.StringRelatedField(source='usuario_registra', read_only=True)
    archivo_url = serializers.SerializerMethodField()

    class Meta:
        model = Documento
        fields = [
            'id', 'expediente', 'tipo_documento', 'tipo_documento_nombre',
            'nombre_documento', 'descripcion', 'archivo', 'archivo_url',
            'usuario_registra', 'usuario_registra_nombre'
        ]
        read_only_fields = ['usuario_registra']

    def get_archivo_url(self, obj):
        request = self.context.get('request')
        if obj.archivo and request:
            return request.build_absolute_uri(obj.archivo.url)
        elif obj.archivo:
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
        fields = '__all__'
        read_only_fields = ['fecha', 'usuario']