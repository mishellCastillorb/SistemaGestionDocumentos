from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import QuejaDenuncia, Expediente, Documento

class DashboardResumenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        total_quejas = QuejaDenuncia.objects.count()

        expedientes_activos = Expediente.objects.exclude(
            estado__nombre="Concluido"
        ).count()

        expedientes_concluidos = Expediente.objects.filter(
            estado__nombre="Concluido"
        ).count()

        total_documentos = Documento.objects.count()

        return Response({
            "total_quejas": total_quejas,
            "expedientes_activos": expedientes_activos,
            "expedientes_concluidos": expedientes_concluidos,
            "total_documentos": total_documentos
        })
