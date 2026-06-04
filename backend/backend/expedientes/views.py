from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.timezone import now

from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from datetime import timedelta
from django.utils.timezone import now


from backend.expedientes.models import (
    AnalisisDocumento,
    Area,
    Documento,
    EstadoExpediente,
    Expediente,
    ExpedienteUsuario,
    MotivoConclusion,
    MovimientoExpediente,
    PasswordResetRequest,
    QuejaDenuncia,
    TipoMovimiento,
    TipoParticipacion,
    TipoRegistro,
    Usuario,
)

from .permissions import (
    EsAdministrador,
    EsAnalistaOAdministrador,
    EsCapturistaOAdministrador,
    SoloLecturaPorRol,
)

from .serializers import (
    AdministradorPasswordTemporalSerializer,
    AnalisisDocumentoSerializer,
    AsignarResponsableSerializer,
    CambiarEstadoExpedienteSerializer,
    CambiarPasswordSerializer,
    ConcluirExpedienteSerializer,
    CorreccionAnalisisDocumentoSerializer,
    DocumentoSerializer,
    ExpedienteSerializer,
    MovimientoExpedienteSerializer,
    PasswordResetRequestModelSerializer,
    PasswordResetRequestSerializer,
    QuejaDenunciaSerializer,
    RegistrarObservacionSerializer,
    RevisionAnalisisDocumentoSerializer,
    UsuarioSerializer,
)

from .services.analizador_documentos import (
    analizar_texto,
    extraer_texto_pdf,
)


def obtener_tipo_movimiento_por_nombres(*nombres):
    """
    Busca un tipo de movimiento aceptando varios nombres posibles.

    Esto evita errores cuando el catálogo tiene nombres ligeramente distintos,
    por ejemplo:
    - "Apertura de expediente"
    - "Creación de expediente"

    Si no encuentra ningún registro, responde con error 400 en lugar de romper
    el servidor con un DoesNotExist.
    """

    for nombre in nombres:
        tipo_movimiento = TipoMovimiento.objects.filter(
            nombre__iexact=nombre
        ).first()

        if tipo_movimiento:
            return tipo_movimiento

    nombres_esperados = ", ".join(nombres)

    raise ValidationError(
        {
            "tipo_movimiento": (
                "No se encontró ningún tipo de movimiento válido. "
                f"Se esperaba alguno de estos nombres: {nombres_esperados}. "
                "Verifica que los catálogos base estén cargados."
            )
        }
    )
    
def normalizar_estado(nombre_estado):
    if not nombre_estado:
        return ""

    reemplazos = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
    }

    nombre = nombre_estado.strip().lower()

    for acento, sin_acento in reemplazos.items():
        nombre = nombre.replace(acento, sin_acento)

    return nombre


def obtener_fecha_minima_inactivacion(expediente):
    return expediente.fecha_apertura + timedelta(hours=72)


def expediente_puede_inactivarse(expediente):
    return now() >= obtener_fecha_minima_inactivacion(expediente)

def marcar_expedientes_vencidos_como_inactivos():
    estado_inactivo = EstadoExpediente.objects.get(nombre__iexact="inactivo")

    expedientes_vencidos = (
        Expediente.objects.filter(
            fecha_limite_estado__isnull=False,
            fecha_limite_estado__lt=now(),
        )
        .exclude(estado__nombre__iexact="inactivo")
        .exclude(estado__nombre__iexact="concluido")
    )

    tipo_movimiento = obtener_tipo_movimiento_por_nombres(
        "Cambio de estado",
    )

    for expediente in expedientes_vencidos:
        estado_anterior = expediente.estado.nombre

        expediente.estado = estado_inactivo
        expediente.fecha_limite_estado = None
        expediente.save()

        MovimientoExpediente.objects.create(
            expediente=expediente,
            tipo_movimiento=tipo_movimiento,
            descripcion=(
                f"El expediente pasó automáticamente de {estado_anterior} "
                "a Inactivo por exceder el tiempo límite de atención."
            ),
            usuario=expediente.queja.usuario_registra,
        )
class ListaTiposRegistroView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tipos = TipoRegistro.objects.all()
        data = [{"id": t.id, "nombre": t.nombre} for t in tipos]
        return Response(data)


class ListaAreasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        areas = Area.objects.all()
        data = [{"id": a.id, "nombre": a.nombre} for a in areas]
        return Response(data)


class SiguienteFolioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        folios_numericos = [
            int(queja.folio)
            for queja in QuejaDenuncia.objects.all()
            if queja.folio and queja.folio.isdigit()
        ]

        siguiente = max(folios_numericos, default=0) + 1

        if len(str(siguiente)) > 15:
            return Response(
                {
                    "error": (
                        "Se alcanzó el límite máximo de folios de 15 caracteres."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"folio": str(siguiente)})
    
class ValidarFolioQuejaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        folio = request.query_params.get("folio", "").strip()

        if not folio:
            return Response(
                {
                    "folio": folio,
                    "disponible": False,
                    "mensaje": "El folio es obligatorio.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(folio) > 15:
            return Response(
                {
                    "folio": folio,
                    "disponible": False,
                    "mensaje": "El folio no puede tener más de 15 caracteres.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existe = QuejaDenuncia.objects.filter(folio=folio).exists()

        if existe:
            return Response(
                {
                    "folio": folio,
                    "disponible": False,
                    "mensaje": "Este folio ya está registrado.",
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "folio": folio,
                "disponible": True,
                "mensaje": "Folio disponible.",
            },
            status=status.HTTP_200_OK,
        )

class ListaExpedientesView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request):
        expedientes = Expediente.objects.all()
        serializer = ExpedienteSerializer(expedientes, many=True)
        return Response(serializer.data)

class CrearQuejaView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, EsCapturistaOAdministrador]

    def post(self, request):
        serializer = QuejaDenunciaSerializer(data=request.data)

        if serializer.is_valid():
            with transaction.atomic():
                queja = serializer.save(usuario_registra=request.user)

                estado_inicial = EstadoExpediente.objects.get(
                    nombre__iexact="registrado"
                )

                expediente = Expediente.objects.create(
                    queja=queja,
                    estado=estado_inicial,
                    fecha_limite_estado = now() + timedelta(hours=72),
                )

                expediente.numero_expediente = f"EXP-{now().year}-{expediente.id:04d}"
                expediente.save()

                tipo_registro_queja = obtener_tipo_movimiento_por_nombres(
                    "Registro de queja",
                    "Creación de expediente",
                    "Apertura de expediente",
                )

                tipo_apertura = obtener_tipo_movimiento_por_nombres(
                    "Apertura de expediente",
                    "Creación de expediente",
                )

                MovimientoExpediente.objects.create(
                    expediente=expediente,
                    tipo_movimiento=tipo_registro_queja,
                    descripcion=f"Se registró la queja con folio {queja.folio}.",
                    usuario=request.user,
                )

                MovimientoExpediente.objects.create(
                    expediente=expediente,
                    tipo_movimiento=tipo_apertura,
                    descripcion=f"Se abrió el expediente {expediente.numero_expediente}.",
                    usuario=request.user,
                )

            return Response(
                {
                    "mensaje": "Queja registrada correctamente.",
                    "queja_id": queja.id,
                    "expediente_id": expediente.id,
                    "numero_expediente": expediente.numero_expediente,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PerfilUsuarioView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)


class CambiarPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CambiarPasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data["password_nueva"])
        request.user.save()

        return Response(
            {"mensaje": "Contraseña actualizada correctamente."},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            usuario = Usuario.objects.get(
                username=serializer.validated_data["username"]
            )
            PasswordResetRequest.objects.create(usuario=usuario)
        except Usuario.DoesNotExist:
            pass

        return Response(
            {
                "mensaje": (
                    "Solicitud de restablecimiento recibida. "
                    "Si el usuario existe, el administrador será notificado."
                )
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestListView(APIView):
    permission_classes = [IsAuthenticated, EsAdministrador]

    def get(self, request):
        solicitudes = PasswordResetRequest.objects.filter(atendido=False)
        serializer = PasswordResetRequestModelSerializer(solicitudes, many=True)
        return Response(serializer.data)


class AdministradorPasswordTemporalView(APIView):
    permission_classes = [IsAuthenticated, EsAdministrador]

    def post(self, request):
        serializer = AdministradorPasswordTemporalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = get_object_or_404(
            Usuario,
            id=serializer.validated_data["usuario_id"],
        )

        password_temporal = serializer.validated_data["password_temporal"]

        usuario.set_password(password_temporal)
        usuario.save()

        PasswordResetRequest.objects.filter(
            usuario=usuario,
            atendido=False,
        ).update(atendido=True)

        if usuario.email:
            subject = "Contraseña temporal asignada"
            message = (
                f"Hola {usuario.username},\n\n"
                "Tu contraseña temporal ha sido asignada por el administrador.\n"
                f"Utiliza la siguiente contraseña para ingresar: {password_temporal}\n\n"
                "Por favor, cambia tu contraseña después de iniciar sesión."
            )
            from_email = settings.DEFAULT_FROM_EMAIL
            recipient_list = [usuario.email]

            try:
                send_mail(
                    subject,
                    message,
                    from_email,
                    recipient_list,
                    fail_silently=False,
                )
            except Exception as error:
                return Response(
                    {
                        "mensaje": (
                            "Contraseña temporal asignada, pero no se pudo "
                            "enviar el correo."
                        ),
                        "error": str(error),
                    },
                    status=status.HTTP_200_OK,
                )

        return Response(
            {
                "mensaje": (
                    "Contraseña temporal asignada correctamente y enviada "
                    "por correo electrónico."
                ),
                "usuario": UsuarioSerializer(usuario).data,
            },
            status=status.HTTP_200_OK,
        )


class ListaUsuariosView(APIView):
    permission_classes = [IsAuthenticated, EsAdministrador]

    def get(self, request):
        usuarios = Usuario.objects.all()
        serializer = UsuarioSerializer(usuarios, many=True)
        return Response(serializer.data)


class ListaQuejasView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request):
        quejas = QuejaDenuncia.objects.all().order_by("-fecha_ingreso")
        serializer = QuejaDenunciaSerializer(quejas, many=True)
        return Response(serializer.data)


class DetalleQuejaView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, pk):
        queja = get_object_or_404(QuejaDenuncia, pk=pk)
        serializer = QuejaDenunciaSerializer(queja)
        return Response(serializer.data)
    
class DetalleExpedienteView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, pk):
        expediente = get_object_or_404(Expediente, pk=pk)
        serializer = ExpedienteSerializer(expediente)
        return Response(serializer.data)


class AsignarResponsableView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request, expediente_id):
        serializer = AsignarResponsableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expediente = get_object_or_404(Expediente, id=expediente_id)
        usuario = get_object_or_404(
            Usuario,
            id=serializer.validated_data["usuario_id"],
        )
        tipo_participacion = get_object_or_404(
            TipoParticipacion,
            id=serializer.validated_data["tipo_participacion_id"],
        )

        ExpedienteUsuario.objects.filter(
            expediente=expediente,
            tipo_participacion=tipo_participacion,
            activo=True,
        ).update(activo=False)

        ExpedienteUsuario.objects.create(
            expediente=expediente,
            usuario=usuario,
            tipo_participacion=tipo_participacion,
            activo=True,
        )

        tipo_movimiento = obtener_tipo_movimiento_por_nombres(
            "Asignación de responsable",
            "Asignación de usuario",
        )

        MovimientoExpediente.objects.create(
            expediente=expediente,
            tipo_movimiento=tipo_movimiento,
            descripcion=(
                f"Se asignó a {usuario.username} con participación "
                f"{tipo_participacion.nombre}."
            ),
            usuario=request.user,
        )

        return Response(
            {"mensaje": "Responsable asignado correctamente."},
            status=status.HTTP_201_CREATED,
        )


class ConcluirExpedienteView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request, expediente_id):
        serializer = ConcluirExpedienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expediente = get_object_or_404(Expediente, id=expediente_id)

        if expediente.estado and expediente.estado.nombre.lower() == "concluido":
            return Response(
                {"error": "El expediente ya está concluido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        motivo = get_object_or_404(
            MotivoConclusion,
            id=serializer.validated_data["motivo_conclusion_id"],
        )

        estado_concluido = EstadoExpediente.objects.get(nombre__iexact="concluido")

        expediente.estado = estado_concluido
        expediente.fecha_cierre = now()
        expediente.fecha_limite_estado = None
        expediente.motivo_conclusion = motivo
        expediente.observaciones_finales = serializer.validated_data[
            "observaciones_finales"
        ]
        expediente.save()

        tipo_movimiento = obtener_tipo_movimiento_por_nombres(
            "Conclusión de expediente",
        )

        MovimientoExpediente.objects.create(
            expediente=expediente,
            tipo_movimiento=tipo_movimiento,
            descripcion=f"El expediente fue concluido por motivo: {motivo.nombre}.",
            usuario=request.user,
        )

        return Response({"mensaje": "Expediente concluido correctamente."})


class DetalleExpedienteView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, pk):
        marcar_expedientes_vencidos_como_inactivos()

        expediente = get_object_or_404(Expediente, pk=pk)
        serializer = ExpedienteSerializer(expediente)
        return Response(serializer.data)

class CambiarEstadoExpedienteView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request, expediente_id):
        serializer = CambiarEstadoExpedienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expediente = get_object_or_404(Expediente, id=expediente_id)
        estado_nuevo = get_object_or_404(
            EstadoExpediente,
            id=serializer.validated_data["estado_id"],
        )

        estado_actual_nombre = expediente.estado.nombre if expediente.estado else ""
        estado_nuevo_nombre = estado_nuevo.nombre

        estado_actual = normalizar_estado(estado_actual_nombre)
        estado_destino = normalizar_estado(estado_nuevo_nombre)

        if expediente.estado_id == estado_nuevo.id:
            return Response(
                {
                    "error": (
                        f'El expediente ya se encuentra en el estado '
                        f'"{estado_nuevo.nombre}".'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if estado_actual == "concluido":
            return Response(
                {
                    "error": (
                        "No se puede cambiar el estado de un expediente concluido."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if estado_destino == "concluido":
            return Response(
                {
                    "error": (
                        "Para concluir el expediente debes usar la opción "
                        "Concluir expediente."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if estado_destino == "registrado":
            return Response(
                {
                    "error": (
                        "No se puede regresar un expediente al estado Registrado."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if estado_actual == "registrado" and estado_destino not in [
            "en revision",
            "en investigacion",
            "inactivo",
        ]:
            return Response(
                {
                    "error": (
                        "Desde Registrado solo se puede cambiar a En revisión, "
                        "En investigación o Inactivo cuando hayan pasado 72 horas."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if estado_actual == "inactivo" and estado_destino not in [
            "en revision",
            "en investigacion",
        ]:
            return Response(
                {
                    "error": (
                        "Para volver a activar un expediente inactivo, solo se "
                        "puede cambiar a En revisión o En investigación."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if estado_destino == "inactivo" and not expediente_puede_inactivarse(
            expediente
        ):
            fecha_minima = obtener_fecha_minima_inactivacion(expediente)

            return Response(
                {
                    "error": (
                        "No se puede marcar el expediente como Inactivo antes "
                        "de que transcurran 72 horas desde su apertura. "
                        f"Podrá inactivarse a partir de: "
                        f"{fecha_minima.strftime('%d/%m/%Y %H:%M')}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        expediente.estado = estado_nuevo

        if estado_destino == "inactivo":
            expediente.fecha_limite_estado = None
        elif expediente.fecha_limite_estado is None and not expediente_puede_inactivarse(
            expediente
        ):
            expediente.fecha_limite_estado = obtener_fecha_minima_inactivacion(
                expediente
            )

        expediente.save()

        tipo_movimiento = obtener_tipo_movimiento_por_nombres(
            "Cambio de estado",
        )

        MovimientoExpediente.objects.create(
            expediente=expediente,
            tipo_movimiento=tipo_movimiento,
            descripcion=(
                f"El expediente cambió de {estado_actual_nombre} "
                f"a {estado_nuevo.nombre}."
            ),
            usuario=request.user,
        )

        return Response({"mensaje": "Estado actualizado correctamente."})

class CrearDocumentoView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request):
        expediente = get_object_or_404(
            Expediente,
            id=request.data.get("expediente"),
        )

        if expediente.estado and expediente.estado.nombre.lower() == "concluido":
            return Response(
                {
                    "error": (
                        "No se pueden agregar documentos a un expediente concluido."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = DocumentoSerializer(data=request.data)

        if serializer.is_valid():
            documento = serializer.save(usuario_registra=request.user)

            if documento.archivo:
                try:
                    texto = extraer_texto_pdf(documento.archivo.path)
                    resultado = analizar_texto(texto)

                    AnalisisDocumento.objects.create(
                        documento=documento,
                        prioridad=resultado["prioridad"],
                        categoria=resultado["categoria"],
                        palabras_detectadas=resultado["palabras_detectadas"],
                        requiere_atencion=resultado["requiere_atencion"],
                        justificacion=resultado["justificacion"],
                        texto_extraido=resultado["texto_extraido"],
                        confianza=resultado["confianza"],
                        metodo_analisis=resultado["metodo_analisis"],
                        version_analizador=resultado["version_analizador"],
                        error_analisis=resultado["error_analisis"],
                        estado_revision=AnalisisDocumento.ESTADO_PENDIENTE_REVISION,
                    )

                except Exception as error:
                    AnalisisDocumento.objects.create(
                        documento=documento,
                        prioridad="No determinada",
                        categoria="Revisión manual requerida",
                        palabras_detectadas="",
                        requiere_atencion=True,
                        justificacion=(
                            "No fue posible analizar automáticamente el documento. "
                            "Se recomienda revisión manual por parte del analista."
                        ),
                        texto_extraido="",
                        confianza=0.00,
                        metodo_analisis=AnalisisDocumento.METODO_REGLAS,
                        version_analizador="1.3",
                        error_analisis=str(error),
                        estado_revision=AnalisisDocumento.ESTADO_ERROR,
                    )

            tipo_movimiento = obtener_tipo_movimiento_por_nombres(
                "Incorporación de documento",
                "Registro de documento",
            )

            MovimientoExpediente.objects.create(
                expediente=documento.expediente,
                tipo_movimiento=tipo_movimiento,
                descripcion=f"Se incorporó el documento: {documento.nombre_documento}.",
                usuario=request.user,
            )

            serializer_response = DocumentoSerializer(
                documento,
                context={"request": request},
            )

            return Response(
                serializer_response.data,
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ListaDocumentosView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request):
        documentos = Documento.objects.all().order_by("-id")
        serializer = DocumentoSerializer(
            documentos,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)


class DetalleDocumentoView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, pk):
        documento = get_object_or_404(Documento, pk=pk)
        serializer = DocumentoSerializer(
            documento,
            context={"request": request},
        )
        return Response(serializer.data)


class DocumentosPorExpedienteView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, expediente_id):
        documentos = Documento.objects.filter(
            expediente_id=expediente_id
        ).order_by("-id")

        serializer = DocumentoSerializer(
            documentos,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)


class MovimientosPorExpedienteView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, expediente_id):
        movimientos = MovimientoExpediente.objects.filter(
            expediente_id=expediente_id
        ).order_by("-fecha")

        serializer = MovimientoExpedienteSerializer(movimientos, many=True)
        return Response(serializer.data)


class RegistrarObservacionView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request):
        serializer = RegistrarObservacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expediente = get_object_or_404(
            Expediente,
            id=serializer.validated_data["expediente_id"],
        )

        if expediente.estado and expediente.estado.nombre.lower() == "concluido":
            return Response(
                {
                    "error": (
                        "No se pueden registrar observaciones en un expediente concluido."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        tipo_movimiento = obtener_tipo_movimiento_por_nombres(
            "Observación",
        )

        movimiento = MovimientoExpediente.objects.create(
            expediente=expediente,
            tipo_movimiento=tipo_movimiento,
            descripcion=serializer.validated_data["descripcion"],
            usuario=request.user,
        )

        return Response(
            MovimientoExpedienteSerializer(movimiento).data,
            status=status.HTTP_201_CREATED,
        )


class DetalleMovimientoView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, pk):
        movimiento = get_object_or_404(MovimientoExpediente, pk=pk)
        serializer = MovimientoExpedienteSerializer(movimiento)
        return Response(serializer.data)


class EliminarDocumentoView(generics.DestroyAPIView):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer

    def destroy(self, request, *args, **kwargs):
        documento = self.get_object()

        if documento.archivo:
            documento.archivo.delete(save=False)

        documento.delete()

        return Response(
            {"mensaje": "Documento eliminado correctamente."},
            status=status.HTTP_200_OK,
        )


class AceptarAnalisisDocumentoView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request, analisis_id):
        analisis = get_object_or_404(AnalisisDocumento, id=analisis_id)

        if analisis.estado_revision == AnalisisDocumento.ESTADO_ACEPTADO:
            return Response(
                {"error": "Este análisis ya fue aceptado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RevisionAnalisisDocumentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        analisis.estado_revision = AnalisisDocumento.ESTADO_ACEPTADO
        analisis.categoria_final = analisis.categoria
        analisis.prioridad_final = analisis.prioridad
        analisis.comentario_revisor = serializer.validated_data.get(
            "comentario_revisor",
            "",
        )
        analisis.revisado_por = request.user
        analisis.revisado_en = now()
        analisis.save()

        return Response(
            {
                "mensaje": "Clasificación sugerida aceptada correctamente.",
                "analisis": AnalisisDocumentoSerializer(analisis).data,
            },
            status=status.HTTP_200_OK,
        )


class RechazarAnalisisDocumentoView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request, analisis_id):
        analisis = get_object_or_404(AnalisisDocumento, id=analisis_id)

        if analisis.estado_revision == AnalisisDocumento.ESTADO_RECHAZADO:
            return Response(
                {"error": "Este análisis ya fue rechazado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RevisionAnalisisDocumentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        analisis.estado_revision = AnalisisDocumento.ESTADO_RECHAZADO
        analisis.categoria_final = ""
        analisis.prioridad_final = ""
        analisis.comentario_revisor = serializer.validated_data.get(
            "comentario_revisor",
            "",
        )
        analisis.revisado_por = request.user
        analisis.revisado_en = now()
        analisis.save()

        return Response(
            {
                "mensaje": "Clasificación sugerida rechazada correctamente.",
                "analisis": AnalisisDocumentoSerializer(analisis).data,
            },
            status=status.HTTP_200_OK,
        )


class CorregirAnalisisDocumentoView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request, analisis_id):
        analisis = get_object_or_404(AnalisisDocumento, id=analisis_id)

        serializer = CorreccionAnalisisDocumentoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        analisis.estado_revision = AnalisisDocumento.ESTADO_CORREGIDO
        analisis.categoria_final = serializer.validated_data["categoria_final"]
        analisis.prioridad_final = serializer.validated_data["prioridad_final"]
        analisis.comentario_revisor = serializer.validated_data.get(
            "comentario_revisor",
            "",
        )
        analisis.revisado_por = request.user
        analisis.revisado_en = now()
        analisis.save()

        return Response(
            {
                "mensaje": "Clasificación corregida correctamente.",
                "analisis": AnalisisDocumentoSerializer(analisis).data,
            },
            status=status.HTTP_200_OK,
        )


class ReanalizarDocumentoView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request, documento_id):
        documento = get_object_or_404(Documento, id=documento_id)

        expediente = documento.expediente

        if expediente.estado and expediente.estado.nombre.lower() == "concluido":
            return Response(
                {
                    "error": (
                        "No se puede reanalizar un documento de un expediente concluido."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not documento.archivo:
            return Response(
                {"error": "El documento no tiene un archivo asociado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        analisis_existente = getattr(documento, "analisis", None)

        if analisis_existente and analisis_existente.estado_revision in [
            AnalisisDocumento.ESTADO_ACEPTADO,
            AnalisisDocumento.ESTADO_RECHAZADO,
            AnalisisDocumento.ESTADO_CORREGIDO,
        ]:
            return Response(
                {
                    "error": (
                        "No se puede reanalizar un documento cuya clasificación "
                        "ya fue revisada por un usuario. Si es necesario cambiarla, "
                        "usa la corrección o clasificación manual."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            texto = extraer_texto_pdf(documento.archivo.path)
            resultado = analizar_texto(texto)

            analisis, _ = AnalisisDocumento.objects.update_or_create(
                documento=documento,
                defaults={
                    "prioridad": resultado["prioridad"],
                    "categoria": resultado["categoria"],
                    "palabras_detectadas": resultado["palabras_detectadas"],
                    "requiere_atencion": resultado["requiere_atencion"],
                    "justificacion": resultado["justificacion"],
                    "texto_extraido": resultado["texto_extraido"],
                    "confianza": resultado["confianza"],
                    "metodo_analisis": resultado["metodo_analisis"],
                    "version_analizador": resultado["version_analizador"],
                    "error_analisis": resultado["error_analisis"],
                    "estado_revision": AnalisisDocumento.ESTADO_PENDIENTE_REVISION,
                    "categoria_final": "",
                    "prioridad_final": "",
                    "comentario_revisor": "",
                    "revisado_por": None,
                    "revisado_en": None,
                },
            )

            return Response(
                {
                    "mensaje": "Documento reanalizado correctamente.",
                    "analisis": AnalisisDocumentoSerializer(analisis).data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            analisis, _ = AnalisisDocumento.objects.update_or_create(
                documento=documento,
                defaults={
                    "prioridad": "No determinada",
                    "categoria": "Revisión manual requerida",
                    "palabras_detectadas": "",
                    "requiere_atencion": True,
                    "justificacion": (
                        "No fue posible reanalizar automáticamente el documento. "
                        "Se recomienda revisión manual por parte del analista."
                    ),
                    "texto_extraido": "",
                    "confianza": 0.00,
                    "metodo_analisis": AnalisisDocumento.METODO_REGLAS,
                    "version_analizador": "1.3",
                    "error_analisis": str(error),
                    "estado_revision": AnalisisDocumento.ESTADO_ERROR,
                    "categoria_final": "",
                    "prioridad_final": "",
                    "comentario_revisor": "",
                    "revisado_por": None,
                    "revisado_en": None,
                },
            )

            return Response(
                {
                    "mensaje": "El documento se conservó, pero ocurrió un error al reanalizar.",
                    "analisis": AnalisisDocumentoSerializer(analisis).data,
                },
                status=status.HTTP_200_OK,
            )
