from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns=[
    path('',views.index,name='index_view'),
    path('api/auth/register/',views.Register.as_view(),name='register_view'),
    path('api/auth/login/',views.Login.as_view(),name='login_view'),
    path('api/refresh-token/',views.CustomTokenRefreshView.as_view(),name='token-refresh'),
    path('api/connection/request/add/',views.SendConnection.as_view(),name='send_connection'),
    path('api/connection/request/<int:pk>/',views.RequestConnection.as_view(),name="request_connection_view"),
    path('api/connection/connects/',views.GetAllConnections.as_view(),name='connect_view'),
    path('api/connection/pending/',views.PendingConnection.as_view(),name='pending-connect'),
    path('api/connection/request/',views.PendingConnection.as_view(),name='pending-connect'),
    path('api/conversation/create/',views.CreateConversation.as_view(),name='create_conversation_view'),
    path('api/conversations/',views.Conversations.as_view(),
         name='conversation_view'),
    path('api/conversation/<int:conversation_id>/messages/',views.FetchMessage.as_view(),name='message_view'),
    path('api/find-users/',views.SearchConnection.as_view(),name='search-view'),
    path('api/message-receipt/<int:conversation_id>/',views.UpdateMessageReadReceipt.as_view(),name='update_receipt'),
    path('api/conversation/<int:conversation_id>/participants/',views.UpdateGroupMember.as_view(),name='update_group'),
    path('api/message-reaction/<int:message_id>/',views.MessageReactionView.as_view(),name='message_reaction'),
    path('api/conversation/<int:conversation_id>/file-upload/',views.FileUploadView.as_view(),name='file-upload'),
    path('api/auth/check-email/',views.CheckEmailorPhone.as_view(),name='check_email'),
    path('api/verify-otp/',views.VerifyOtp.as_view(),name='verify-otp'),
    path('api/me/',views.MiniProfile.as_view(),name='profile-view')
]
if settings.DEBUG:
    urlpatterns+=static(settings.MEDIA_URL,document_root=settings.MEDIA_ROOT)
