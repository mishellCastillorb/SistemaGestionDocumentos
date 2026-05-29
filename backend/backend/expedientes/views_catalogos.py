from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.expedientes.models import TipoDocumento


class ListaTiposDocumentoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tipos_documento = TipoDocumento.objects.all().order_by("id")

        data = [
            {
                "id": tipo.id,
                "nombre": tipo.nombre,
            }
            for tipo in tipos_documento
        ]

        return Response(data)