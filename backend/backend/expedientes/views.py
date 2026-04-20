from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from backend.expedientes.models import (
    Expediente, QuejaDenuncia, EstadoExpediente, ExpedienteUsuario, Usuario,
    TipoParticipacion, MotivoConclusion, Documento, MovimientoExpediente, TipoMovimiento
)
from .serializers import (
    ExpedienteSerializer,
    QuejaDenunciaSerializer,
    UsuarioSerializer,
    CambiarPasswordSerializer,
    AsignarResponsableSerializer,
    ConcluirExpedienteSerializer,
    CambiarEstadoExpedienteSerializer,
    DocumentoSerializer,
    MovimientoExpedienteSerializer,
    RegistrarObservacionSerializer
)
from .permissions import EsCapturistaOAdministrador, SoloLecturaPorRol, EsAnalistaOAdministrador
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from django.db import transaction


class ListaExpedientesView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request):
        expedientes = Expediente.objects.all()
        serializer = ExpedienteSerializer(expedientes, many=True)
        return Response(serializer.data)


class CrearQuejaView(APIView):
    permission_classes = [IsAuthenticated, EsCapturistaOAdministrador]

    def post(self, request):
        serializer = QuejaDenunciaSerializer(data=request.data)

        if serializer.is_valid():
            with transaction.atomic():
                queja = serializer.save(usuario_registra=request.user)

                estado_inicial = EstadoExpediente.objects.get(nombre__iexact='registrado')

                expediente = Expediente.objects.create(
                    queja=queja,
                    estado=estado_inicial
                )

                expediente.numero_expediente = f"EXP-{now().year}-{expediente.id:04d}"
                expediente.save()

                tipo_registro_queja = TipoMovimiento.objects.get(nombre__iexact='Registro de queja')
                tipo_apertura = TipoMovimiento.objects.get(nombre__iexact='Apertura de expediente')

                MovimientoExpediente.objects.create(
                    expediente=expediente,
                    tipo_movimiento=tipo_registro_queja,
                    descripcion=f"Se registró la queja con folio {queja.folio}.",
                    usuario=request.user
                )

                MovimientoExpediente.objects.create(
                    expediente=expediente,
                    tipo_movimiento=tipo_apertura,
                    descripcion=f"Se abrió el expediente {expediente.numero_expediente}.",
                    usuario=request.user
                )

            return Response({
                "mensaje": "Queja registrada correctamente.",
                "queja_id": queja.id,
                "expediente_id": expediente.id,
                "numero_expediente": expediente.numero_expediente
            }, status=status.HTTP_201_CREATED)

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
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['password_nueva'])
        request.user.save()

        return Response(
            {'mensaje': 'Contraseña actualizada correctamente.'},
            status=status.HTTP_200_OK
        )


class ListaQuejasView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request):
        quejas = QuejaDenuncia.objects.all().order_by('-fecha_ingreso')
        serializer = QuejaDenunciaSerializer(quejas, many=True)
        return Response(serializer.data)


class DetalleQuejaView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, pk):
        queja = get_object_or_404(QuejaDenuncia, pk=pk)
        serializer = QuejaDenunciaSerializer(queja)
        return Response(serializer.data)


class AsignarResponsableView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request, expediente_id):
        serializer = AsignarResponsableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expediente = get_object_or_404(Expediente, id=expediente_id)
        usuario = get_object_or_404(Usuario, id=serializer.validated_data['usuario_id'])
        tipo_participacion = get_object_or_404(
            TipoParticipacion,
            id=serializer.validated_data['tipo_participacion_id']
        )

        ExpedienteUsuario.objects.filter(
            expediente=expediente,
            tipo_participacion=tipo_participacion,
            activo=True
        ).update(activo=False)

        ExpedienteUsuario.objects.create(
            expediente=expediente,
            usuario=usuario,
            tipo_participacion=tipo_participacion,
            activo=True
        )

        tipo_movimiento = TipoMovimiento.objects.get(nombre__iexact='Asignación de responsable')

        MovimientoExpediente.objects.create(
            expediente=expediente,
            tipo_movimiento=tipo_movimiento,
            descripcion=f"Se asignó a {usuario.username} con participación {tipo_participacion.nombre}.",
            usuario=request.user
        )

        return Response(
            {'mensaje': 'Responsable asignado correctamente.'},
            status=status.HTTP_201_CREATED
        )


class ConcluirExpedienteView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request, expediente_id):
        serializer = ConcluirExpedienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expediente = get_object_or_404(Expediente, id=expediente_id)

        if expediente.estado and expediente.estado.nombre.lower() == 'concluido':
            return Response(
                {'error': 'El expediente ya está concluido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = get_object_or_404(
            MotivoConclusion,
            id=serializer.validated_data['motivo_conclusion_id']
        )
        estado_concluido = EstadoExpediente.objects.get(nombre__iexact='concluido')

        expediente.estado = estado_concluido
        expediente.fecha_cierre = now()
        expediente.motivo_conclusion = motivo
        expediente.observaciones_finales = serializer.validated_data['observaciones_finales']
        expediente.save()

        tipo_movimiento = TipoMovimiento.objects.get(nombre__iexact='Conclusión de expediente')

        MovimientoExpediente.objects.create(
            expediente=expediente,
            tipo_movimiento=tipo_movimiento,
            descripcion=f"El expediente fue concluido por motivo: {motivo.nombre}.",
            usuario=request.user
        )

        return Response({'mensaje': 'Expediente concluido correctamente.'})


class DetalleExpedienteView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, pk):
        expediente = get_object_or_404(Expediente, pk=pk)
        serializer = ExpedienteSerializer(expediente)
        return Response(serializer.data)


class CambiarEstadoExpedienteView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request, expediente_id):
        serializer = CambiarEstadoExpedienteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expediente = get_object_or_404(Expediente, id=expediente_id)
        estado = get_object_or_404(EstadoExpediente, id=serializer.validated_data['estado_id'])

        if expediente.estado_id == estado.id:
            return Response(
                {'error': f'El expediente ya se encuentra en el estado "{estado.nombre}".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if estado.nombre.lower() == 'concluido':
            return Response(
                {'error': 'Para concluir el expediente debes usar la opción de concluir expediente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        expediente.estado = estado
        expediente.save()

        tipo_movimiento = TipoMovimiento.objects.get(nombre__iexact='Cambio de estado')

        MovimientoExpediente.objects.create(
            expediente=expediente,
            tipo_movimiento=tipo_movimiento,
            descripcion=f"El expediente cambió al estado: {estado.nombre}.",
            usuario=request.user
        )

        return Response({'mensaje': 'Estado actualizado correctamente.'})


class CrearDocumentoView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request):
        expediente = get_object_or_404(Expediente, id=request.data.get('expediente'))

        if expediente.estado and expediente.estado.nombre.lower() == 'concluido':
            return Response(
                {'error': 'No se pueden agregar documentos a un expediente concluido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DocumentoSerializer(data=request.data)

        if serializer.is_valid():
            documento = serializer.save(usuario_registra=request.user)

            tipo_movimiento = TipoMovimiento.objects.get(
                nombre__iexact='Incorporación de documento'
            )

            MovimientoExpediente.objects.create(
                expediente=documento.expediente,
                tipo_movimiento=tipo_movimiento,
                descripcion=f"Se incorporó el documento: {documento.nombre_documento}.",
                usuario=request.user
            )

            serializer_response = DocumentoSerializer(
                documento,
                context={'request': request}
            )

            return Response(serializer_response.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ListaDocumentosView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request):
        documentos = Documento.objects.all().order_by('-id')
       # serializer = DocumentoSerializer(documentos, many=True)
        serializer = DocumentoSerializer(documentos, many=True, context={'request': request})
        return Response(serializer.data)


class DetalleDocumentoView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, pk):
        documento = get_object_or_404(Documento, pk=pk)
#        serializer = DocumentoSerializer(documento)
        serializer = DocumentoSerializer(documento, many=True, context={'request': request})
        return Response(serializer.data)


class DocumentosPorExpedienteView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, expediente_id):
        documentos = Documento.objects.filter(expediente_id=expediente_id).order_by('-id')
        #serializer = DocumentoSerializer(documentos, many=True)
        serializer = DocumentoSerializer(documentos, many=True, context={'request': request})
        return Response(serializer.data)


class MovimientosPorExpedienteView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, expediente_id):
        movimientos = MovimientoExpediente.objects.filter(
            expediente_id=expediente_id
        ).order_by('-fecha')

        serializer = MovimientoExpedienteSerializer(movimientos, many=True)
        return Response(serializer.data)


class RegistrarObservacionView(APIView):
    permission_classes = [IsAuthenticated, EsAnalistaOAdministrador]

    def post(self, request):
        serializer = RegistrarObservacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        expediente = get_object_or_404(Expediente, id=serializer.validated_data['expediente_id'])

        if expediente.estado and expediente.estado.nombre.lower() == 'concluido':
            return Response(
                {'error': 'No se pueden registrar observaciones en un expediente concluido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        tipo_movimiento = TipoMovimiento.objects.get(nombre__iexact='Observación')

        movimiento = MovimientoExpediente.objects.create(
            expediente=expediente,
            tipo_movimiento=tipo_movimiento,
            descripcion=serializer.validated_data['descripcion'],
            usuario=request.user
        )

        return Response(
            MovimientoExpedienteSerializer(movimiento).data,
            status=status.HTTP_201_CREATED
        )


class DetalleMovimientoView(APIView):
    permission_classes = [IsAuthenticated, SoloLecturaPorRol]

    def get(self, request, pk):
        movimiento = get_object_or_404(MovimientoExpediente, pk=pk)
        serializer = MovimientoExpedienteSerializer(movimiento)
        return Response(serializer.data)