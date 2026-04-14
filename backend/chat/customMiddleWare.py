
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware

class CustomJwtAuthentication(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        from django.contrib.auth.models import AnonymousUser
        from rest_framework_simplejwt.tokens import AccessToken
        headers=dict(scope['headers'])
        cookie_header=headers.get(b'cookie',b'').decode()
        cookies={}
        for cookie in cookie_header.split(';').copy():
            if '=' in cookie:
                key,value=cookie.split('=')
                cookies[key.strip()]=value
        token=cookies.get('access')
        if token:
            try:
                access_token=AccessToken(token)
                user=await self.get_user(access_token['user_id'])
                scope['user']=user
            except Exception as e:
                print('JWT AUTH ERROR:',e)
                scope['user']=AnonymousUser()
        else:
            scope['user']=AnonymousUser()
        
        return await super().__call__(scope,receive,send)
    
    @database_sync_to_async
    def get_user(self,user_id):
        from django.contrib.auth import get_user_model
        User=get_user_model()
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValueError('user doens not exit')



    