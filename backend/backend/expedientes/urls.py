from django.urls import path
from .views import (
    ListaAreasView,
    ListaExpedientesView,
    CrearQuejaView,
    ListaTiposRegistroView,
    PerfilUsuarioView,
    CambiarPasswordView,
    PasswordResetRequestView,
    PasswordResetRequestListView,
    ListaUsuariosView,
    AdministradorPasswordTemporalView,
    ListaQuejasView,
    DetalleQuejaView,
    DetalleExpedienteView,
    AsignarResponsableView,
    ConcluirExpedienteView,
    CambiarEstadoExpedienteView,
    CrearDocumentoView,
    ListaDocumentosView,
    DetalleDocumentoView,
    DocumentosPorExpedienteView,
    MovimientosPorExpedienteView,
    RegistrarObservacionView,
    DetalleMovimientoView,
    SiguienteFolioView
)

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('expedientes/', ListaExpedientesView.as_view(), name='lista_expedientes'),
    path('expedientes/<int:pk>/', DetalleExpedienteView.as_view(), name='detalle_expediente'),
    path('expedientes/<int:expediente_id>/asignar-responsable/', AsignarResponsableView.as_view(), name='asignar_responsable'),
    path('expedientes/<int:expediente_id>/concluir/', ConcluirExpedienteView.as_view(), name='concluir_expediente'),
    path('expedientes/<int:expediente_id>/cambiar-estado/', CambiarEstadoExpedienteView.as_view(), name='cambiar_estado_expediente'),

    path('quejas/', CrearQuejaView.as_view(), name='crear_queja'),
    path('quejas/lista/', ListaQuejasView.as_view(), name='lista_quejas'),
    path('quejas/<int:pk>/', DetalleQuejaView.as_view(), name='detalle_queja'),
    path('quejas/siguiente-folio/', SiguienteFolioView.as_view(), name='siguiente_folio'),

    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('mi-perfil/', PerfilUsuarioView.as_view(), name='mi_perfil'),
    path('cambiar-password/', CambiarPasswordView.as_view(), name='cambiar_password'),

    path('documentos/', CrearDocumentoView.as_view(), name='crear_documento'),
    path('documentos/lista/', ListaDocumentosView.as_view(), name='lista_documentos'),
    path('documentos/<int:pk>/', DetalleDocumentoView.as_view(), name='detalle_documento'),
    path('expedientes/<int:expediente_id>/documentos/', DocumentosPorExpedienteView.as_view(), name='documentos_por_expediente'),

    path('expedientes/<int:expediente_id>/movimientos/', MovimientosPorExpedienteView.as_view(), name='movimientos_por_expediente'),
    path('movimientos/<int:pk>/', DetalleMovimientoView.as_view(), name='detalle_movimiento'),
    path('movimientos/observacion/', RegistrarObservacionView.as_view(), name='registrar_observacion'),

    path('usuarios/', ListaUsuariosView.as_view(), name='lista_usuarios'),
    path('usuarios/temporal/', AdministradorPasswordTemporalView.as_view(), name='password_temporal'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-requests/', PasswordResetRequestListView.as_view(), name='lista_password_reset_requests'),

    path('catalogos/tipos-registro/', ListaTiposRegistroView.as_view()),
    path('catalogos/areas/', ListaAreasView.as_view()),
]
