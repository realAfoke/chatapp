from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from . serializers import RegisterSerializer,LoginSerializer,ConnectionRequestSerializer,ConnectionSerializer,PendingRequestSerializer,UserSerializer,ConversaitonSerializer,MessageSerializer,MessageReceiptSerializer,MessageReactionSerializer,BasicUserSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from . models import Connection,ConnectionRequest,Conversation,Message,MessageReciept,MessageReaction
from rest_framework import permissions
from rest_framework.parsers import MultiPartParser,FormParser
from rest_framework import generics
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.core.exceptions import PermissionDenied
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
# import redis
from django.core.cache import cache
import random
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError,InvalidToken
from pprint import pprint

# redis_client=redis.Redis(host='localhost',port=6379,decode_responses=True)
# print('redis client:',redis_client)


# Create your views here.
User=get_user_model()

@api_view(['GET'])
def index(request):
    if request.method == 'GET':
        return Response({'hello from backend'})
    
class Register(APIView):
    def post(self,request):
        serializer=RegisterSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save(**request.data)
            return Response({'status':'user created successfully'},status=200)
        return Response(serializer.errors,status=400)

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # serialiser=self.get_serializer(data={'refresh':request.COOKIES.get('refresh')})
        serialiser=self.get_serializer(data={'refresh':request.data.get('refresh')})
        try:
            serialiser.is_valid(raise_exception=True)
        except TokenError as e:
            print(e)
            raise InvalidToken() from e
        return Response({'access':serialiser.validated_data.get('access')})
        
        

class Login(TokenObtainPairView):
    serializer_class=LoginSerializer
    def post(self, request, *args, **kwargs):
        token= super().post(request, *args, **kwargs)
        return Response(token.data)
        # response.set_cookie(
        #     key='refresh',
        #     value=str(cookie_token['refresh']),
        #     path='/',
        #     httponly=True,
        #     secure=True,
        #     samesite='None',
        #     max_age=60*60*24*7
        # )
    


class MiniProfile(generics.RetrieveAPIView):
    serializer_class=BasicUserSerializer
    permission_classes=[permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
        

class CheckEmailorPhone(APIView):
    def post(self,request,*args,**kwargs):
        query={}
        if "email" in request.data:
            query["email"]=request.data.get("email")
        else:
            query["phone"]=request.data.get("phone")
        for key,value in query.copy().items():
            if len(value) <= 1:
                return Response({"error":"input field must not be null"},status=400)
        user=User.objects.filter(**query).exists()
        if user:
            return Response({'error:','Email already registered'},status=409)
        #return Response(request.data)
        otp=random.randint(100000,999999)
        otp_key=list(self.request.data.keys())[0]
        cache.set(f"otp:{self.request.data[otp_key]}",otp,timeout=300)
        send_mail(
            'Your Verification code',f'Your code is:{otp}',
            'donotreply@qill.com',
            [self.request.data['email']]
        )
        return Response({'message':'Code sent'})

class VerifyOtp(APIView):
    def post(self,request,*args,**kwargs):
        otp=self.request.data.pop('otp',None)
        if not (otp or isinstance(otp,int)):
            raise ValidationError('otp cannot be None')
        data_keys=list(self.request.data.keys())
        otp_key=f'otp:{self.request.data[data_keys[0]]}'
        cached_otp=cache.get(otp_key)
        if otp == cached_otp:
            cache.delete(otp_key)
            return Response('verified')
        raise ValidationError({'error':'code invalid or expired'})

    
class SendConnection(generics.CreateAPIView):
    queryset=ConnectionRequest.objects.all()
    serializer_class=ConnectionRequestSerializer
    permission_classes=[permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(from_user=self.request.user)
        return Response(serializer.data)
    

class RequestConnection(generics.UpdateAPIView):
    queryset=ConnectionRequest.objects.all()
    serializer_class=ConnectionRequestSerializer
    permission_classes=[permissions.IsAuthenticated]


    # def update(self, request, *args, **kwargs):
    #     partial=kwargs.pop('partial',False)
    #     instance=self.get_object()
    #     print('data:',request.data)
    #     serialiser=self.get_serializer(instance,data=request.data,partial=partial)
    #     if not serialiser.is_valid():
    #         print(serialiser.errors)

    
    def perform_update(self, serializer):
        print('request:',self.request.data)
        instance=serializer.save()
        if instance.status == 'connected':
            if self.request.user.id == instance.from_user_id:
                user_one=instance.from_user
                user_two=instance.to_user
            else:
                user_one=instance.to_user
                user_two=instance.from_user
            Connection.objects.create(
                user_one=user_one,user_two=user_two
            )


class GetAllConnections(generics.ListAPIView):
    serializer_class=ConnectionSerializer
    permission_classes=[permissions.IsAuthenticated]

    def get_queryset(self):
        current_user=self.request.user
        return Connection.objects.filter(Q(user_one=current_user)|Q(user_two=current_user))
    
class PendingConnection(generics.ListAPIView):
    serializer_class=PendingRequestSerializer
    permission_classes=[permissions.IsAuthenticated]

    def get_queryset(self):
        current_user=self.request.user
        path=self.request.path.split('/')[3]
        if path == 'pending':
            return ConnectionRequest.objects.filter(from_user=current_user,status='pending')
        return ConnectionRequest.objects.filter(to_user=current_user,status='pending')
    
class SearchConnection(generics.ListAPIView):
    serializer_class=BasicUserSerializer

    def get_queryset(self):
        search_param=self.request.query_params.get('search_param')
        if search_param:
            return User.objects.filter(Q(username__istartswith=search_param)|Q(first_name__istartswith=search_param)|Q(last_name__istartswith=search_param))
        return None
    
class CreateConversation(generics.CreateAPIView):
    queryset=Conversation.objects.all()
    serializer_class=ConversaitonSerializer
    permission_classes=[permissions.IsAuthenticated]


class Conversations(generics.ListAPIView):
    serializer_class=ConversaitonSerializer
    permission_classes=[permissions.IsAuthenticated]    
    def get_queryset(self):
        current_user=self.request.user
        return Conversation.objects.filter(participants=current_user).exclude(pending_user__contains=current_user.id).order_by('updated_at')
    
class FetchMessage(generics.ListAPIView):
    serializer_class=MessageSerializer
    permission_classes=[permissions.IsAuthenticated]
    def get_queryset(self):
        conversation_id=self.kwargs['conversation_id']
        current_user=self.request.user
        
        conversation=Conversation.objects.filter(pk=conversation_id,participants=current_user).first()
        before=self.request.query_params.get('message_id')
        if not conversation:
            return Message.objects.none()
        if before:
            msg=Message.objects.filter(conversation=conversation,pk__lt=before).order_by('-timestamp')[:50]
        else:
            msg= Message.objects.filter(conversation=conversation).order_by('-timestamp')[:50]
        return msg[::-1]

class UpdateMessageReadReceipt(generics.UpdateAPIView):
    serializer_class=MessageReceiptSerializer
    permission_classes=[permissions.IsAuthenticated]

    def get_object(self):
        return Conversation.objects.get(id=self.kwargs['conversation_id'])
    
    def update(self, request, *args, **kwargs):
        instance=self.get_object()
        receipts=MessageReciept.objects.filter(user=self.request.user,conversation=instance)
        for receipt in receipts.all():
            serializer=self.get_serializer(receipt,data=request.data,partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
        return Response(serializer.data)

class UpdateGroupMember(APIView):
    permission_classes=[permissions.IsAuthenticated]
    def validation_check(self,):
        conversation_id=self.kwargs['conversation_id']
        self.users_ids=self.request.data.get('users_ids')
        if not isinstance(self.users_ids,list):
            raise ValidationError('user id must be a list')
        if not all(isinstance(x,int) for x in self.users_ids):
            raise ValidationError('All users id must be int')
        current_user=self.request.user
        self.conversation=get_object_or_404(Conversation,id=conversation_id)
        self.existing_ids=set(self.conversation.participants.values_list('id',flat=True))
        admin=set(self.conversation.admin.all().values_list('id',flat=True))
        self.is_super_admin=current_user == self.conversation.super_admin
        self.is_admin=current_user.id in admin
        if not (self.is_super_admin or self.is_admin):
            raise PermissionDenied('Not Authorised')
            
    def patch(self,request,*args,**kwargs):
        self.validation_check()
        add_to_admin=self.request.data.get('admin')
        if add_to_admin and self.is_super_admin:
            self.conversation.admin.add(*self.users_ids)
        new_user_id=[uid for uid in self.users_ids if uid not in self.existing_ids]
        self.conversation.participants.add(*new_user_id)
        return Response({'message':'new members added'})  
    
    def delete(self,request,*args,**kwargs):
        self.validation_check()
        remove_ids=self.users_ids
        current_user=self.request.user
        admin=set(self.conversation.admin.all().values_list('id',flat=True))
        if current_user.id in remove_ids:
            raise ValidationError('cannot remove self')
        for user_id in remove_ids:
            if user_id == self.conversation.super_admin.id:
                raise PermissionDenied('Cant remove super admin')
            if user_id in admin and self.is_super_admin:
                self.conversation.admin.remove(user_id)
        self.conversation.participants.remove(*remove_ids)
        return Response({"message":"Members removed"})
        
        
class MessageReactionView(APIView):
    permission_classes=[permissions.IsAuthenticated]
    def get_message(self):
        self.message_id=self.kwargs.get('message_id')
        self.react_data=self.request.data.copy()
        # self.react_data['message']=self.message_id
        self.message=get_object_or_404(Message,id=self.message_id)
        self.conversation=self.message.conversation
    def post(self,request,*args,**kwargs):
        self.get_message()
        current_user=self.request.user
        all_user=set(self.conversation.participants.all())
        if current_user not in all_user:
            raise PermissionDenied('cant react to message,you\'re not in this conversation')
        if MessageReaction.objects.filter(user=current_user,**self.request.data).exists():
            return Response('you already reacted to the message')
        reaction,_=MessageReaction.objects.update_or_create(user=current_user,message=self.message,defaults={**self.request.data})
        serialiser=MessageReactionSerializer(reaction)
        return Response(serialiser.data)
    
    def delete(self,request,*args,**kwargs):
        self.get_message()
        reaction=get_object_or_404(MessageReaction,message=self.message,user=self.request.user)
        reaction.delete()
        return Response(status=204)
    
class FileUploadView(APIView):
    permission_classes=[permissions.IsAuthenticated]
    parser_classes=[MultiPartParser,FormParser]
    def post(self,request,*args,**kwargs):
        self.conversation_id=self.kwargs.get('conversation_id')
        self.conversation=get_object_or_404(Conversation,id=self.conversation_id)
        current_user=self.request.user
        if not current_user in set(self.conversation.participants.all()):
            raise PermissionDenied('you\re not part of this conversation')
        self.data=self.request.data.copy()
        self.data['conversation']=self.conversation_id
        serializer=MessageSerializer(data=self.data,context={'request':self.request})
        if serializer.is_valid(raise_exception=True):
            serializer.save(sender=self.request.user,content=self.data['content'])
            # print('data:',serializer.data)
            return Response(serializer.data)
            
        return Response(status=204)
