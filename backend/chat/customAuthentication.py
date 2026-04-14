from rest_framework_simplejwt.authentication import JWTAuthentication
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q
from django.contrib.auth import get_user_model
from rest_framework_simplejwt import exceptions

User=get_user_model()

class CustomBackendAuthentication(ModelBackend):
    def authenticate(self, request, username = ..., password = ..., **kwargs):
        print('about to authenticate login')
        if username is None or password is None:
            return
        user=User.objects.filter(Q(username=username)|Q(email=username)|Q(phone=username)).first()
        if user is None:
            return None
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None


class CustomJwtAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token=request.COOKIES.get('access')
        if raw_token is None:
            return None
        try:
            validated_token=self.get_validated_token(raw_token)
            user=self.get_user(validated_token)
            return user,validated_token
        except Exception as e:
            print('Token Validation :',e)
            return None