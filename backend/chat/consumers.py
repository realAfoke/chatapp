from channels.generic.websocket import AsyncWebsocketConsumer
import json
from chat.models import Conversation,Message,MessageReciept,MessageReaction
from . serializers import ConnectionRequestSerializer
from channels.db import database_sync_to_async
import json
from datetime import datetime
from django.core.cache import cache
from asgiref.sync import sync_to_async
from django.conf import settings
from django.forms.models import model_to_dict




def reset_active_user():
    cache.delete('all_active_user')

reset_active_user()

class ContextRequestObj:
    def __init__(self,scope):
        self.scope=scope
        self.user=scope.get('user')
        self.is_anonymoue=scope['user'].is_anonymous
        headers=dict(scope.get('headers'))
        self.host=headers.get(b'host',b'localhost').decode()

        self.scheme= 'https' if not settings.DEBUG else 'http'
    
    def build_absolute_uri(self,url):
        return f'{self.scheme}://{self.host}{url}'

    def is_anonymoue(self):
        return self.user.is_anonymous

class ChatConsumer(AsyncWebsocketConsumer):       
    async def connect(self):
        self.conversation_id=self.scope['url_route']['kwargs'].get('conversation_id',None)
        self.current_user=self.scope['user']
        if self.current_user.is_anonymous:
            await self.close()
            return
        self.conversation=await database_sync_to_async(lambda:Conversation.objects.filter(id=self.conversation_id,participants=self.current_user).first())()
        if not self.conversation:
            await self.close()
            return
        self.group_name=f"chat_{self.conversation_id}"
        await self.channel_layer.group_add(self.group_name,self.channel_name)
        connected_user=await sync_to_async(cache.get)(self.group_name)
        if connected_user:
            connected_user.append({'user':self.current_user.id,'channel':self.channel_name})
        else:
            connected_user=[{'user':self.current_user.id,'channel':self.channel_name}]
        await sync_to_async(cache.set)(self.group_name,connected_user)
        await self.accept()
        unread_reciepts=await self.update_mssg_receipt()
        if unread_reciepts:
            await self.channel_layer.group_send(self.group_name,{'type':'mark.read','message':{'action':'update msg','updatedMessages':unread_reciepts,'reader':self.current_user.id}})



    async def mark_read(self,event):
        message=event['message']
        await self.send(text_data=json.dumps(message))

    @database_sync_to_async
    def add_user_to_conversation(self,pending):
        request=ContextRequestObj(self.scope)
        other_user=pending[0]
        self.conversation.pending_user=[]
        self.conversation.participants.add(other_user)
        self.conversation.save(update_fields=['pending_user'])
        serialiser=ConnectionRequestSerializer(data={'to_user':other_user},context={'request':request})
        if serialiser.is_valid(raise_exception=True):
            serialiser.save(from_user=self.current_user)
        return serialiser.data


        # self.conversation.participants.add(self.conversation.pending_user[0])
    async def receive(self, text_data = None, bytes_data = None):
        data=json.loads(text_data)
        pending=list(self.conversation.pending_user)
        current_active_user=await sync_to_async(cache.get)(self.group_name)
        unique_active_user={user['user'] for user in current_active_user}
        if len(unique_active_user) <= 1:
            if 'userId' in data.keys():
                key=data.get('userId') or list(data['readStatus'].keys()[0])
                data['readStatus'] ={str(key):'Inactive'}
            else:
                data['readStatus']='Inactive'

        if 'currentUserId' in data:
            if data.get('readStatus') != 'Inactive':
                data['reader']=list(data['readStatus'].keys())[0]
            await self.channel_layer.group_send(self.group_name,{'type':'chat.message','message':data})
            if pending:
                await self.add_user_to_conversation(self)
            return
        if 'isTyping' in data.keys():
            await sync_to_async(cache.set)(f'typing_user_{self.current_user.id}','true',300)
            await self.channel_layer.group_send(self.group_name,{'type':'typing.indicator','message':data})
        elif 'reaction' in data.keys():
            data['user']=self.current_user
            await self.save_message_reaction(data)
            data['reader']=data['userId']
            data['user']=self.current_user.id
            await self.channel_layer.group_send(self.group_name,{'type':'chat.message','message':data})
        else:
            # mssg_id=data.pop('id',None)
            other_user=data.pop('userId',None)
            self.kwargs={'sender':self.current_user,'conversation':self.conversation,**data}
            self.message=await self.save_mssg(self.kwargs)
            data['id']=self.message.id
            await self.register_mssg_receipt(other_user)
            if pending:
                await self.add_user_to_conversation(pending)
            data['sender']=self.current_user.id
            data['reader']=other_user
            await self.channel_layer.group_send(self.group_name,{'type':'chat.message','message':data})

    
    async def typing_indicator(self,event):
        message=event['message']
        await self.send(text_data=json.dumps(message))

    async def chat_message(self,event):
        message=event['message']

        await self.send(text_data=json.dumps(message))
    
    async def disconnect(self, code):
        await custom_disconnect(self)
    
    async def status_message(self,event):
        message=event['message']
        await self.send(text_data=json.dumps(message))

    
    @database_sync_to_async
    def save_message_reaction(self,data):
        reaction,_=MessageReaction.objects.get_or_create(user_id=self.current_user.id,conversation=self.conversation, message_id=data['message'], defaults={'reaction':data['reaction']})
        if reaction:
            reaction.reaction=data['reaction']
            reaction.save(update_fields=['reaction'])
        

    @database_sync_to_async
    def save_mssg(self,data):
        return Message.objects.create(sender=data['sender'],conversation=data['conversation'],content=data['content'])

    @database_sync_to_async
    def update_mssg_receipt(self):
        # request=ContextRequestObj(self.scope)
        unread_messages=list(Message.objects.filter(conversation=self.conversation).exclude(sender=self.current_user).exclude(message_reciept__status='Read').values_list('id',flat=True))
        if not unread_messages:
            return
        MessageReciept.objects.filter(message_id__in =unread_messages).update(status='Read')
        return unread_messages

       

    @database_sync_to_async
    def register_mssg_receipt(self,stats):
        if self.conversation.chat_type == 'group':
            return
        message_status='Delivered' if stats else 'Inactive'
        other_user=self.conversation.participants.exclude(id=self.current_user.id)[0]
        MessageReciept.objects.create(user=other_user,message=self.message,status=message_status,conversation=self.conversation)
        
    

    

class ActiveUsers(AsyncWebsocketConsumer):
    async def connect(self):
        self.current_user=self.scope['user']
        if not self.current_user.is_authenticated:
            await self.close()
            return
        await self.accept()
        self.group_name=f'notify_{self.current_user.id}'
        self.general='general'
        await self.channel_layer.group_add(self.group_name,self.channel_name)
        await self.channel_layer.group_add(self.general,self.channel_name)
        general_active_user=await sync_to_async(cache.get)(self.general)
        if general_active_user:
            general_active_user.append({'user':self.current_user.id,'channel':self.channel_name})
        else:
            general_active_user=[{'user':self.current_user.id,'channel':self.channel_name}]
        await sync_to_async(cache.set)(self.general,general_active_user)
        status=list({user['user'] for user in general_active_user})
        await self.channel_layer.group_send(self.general,{'type':'status.message','message':status})
        await self.update_all_mssg_status()



    async def receive(self, text_data = None, bytes_data = None):
        data=json.loads(text_data)
        offline=data.get('offline')
        reciever_id=offline.get('reader') or offline.get('whoIsTyping')
        await self.channel_layer.group_send(f'notify_{reciever_id}',{'type':'notification.chat','messages':data})


    async def notification_chat(self,event):
        notification=event['messages']
        await self.send(json.dumps(notification))


    @database_sync_to_async
    def update_all_mssg_status(self):
        MessageReciept.objects.filter(user=self.current_user,status='Inactive').update(status='Delivered')
    

    async def status_message(self,event):
        message=event['message']
        await self.send(text_data=json.dumps(message))


    async def disconnect(self, code):
        await self.update_model()
        await custom_disconnect(self)


    @database_sync_to_async
    def update_model(self):
        if not self.current_user.is_anonymous:
            from django.contrib.auth import get_user_model
            User=get_user_model()
            user=User.objects.get(id=self.current_user.id)
            user.last_seen=datetime.now()
            user.save(update_fields=['last_seen'])


async def custom_disconnect(self):
    if self.current_user.is_anonymous:
            return
    typing=await sync_to_async(cache.get)(f'typing_user:{self.current_user.id}')
    if typing:
        await self.channel_layer.group_send(self.group_name,{'type':'typing.indicator','message':'stopped typing..'})
    current_active_user=await sync_to_async(cache.get)(self.group_name)
    if current_active_user:
        new_active_user=[user for user in current_active_user if user['channel'] != self.channel_name]
        if not new_active_user:
            await sync_to_async(cache.delete)(self.group_name)
        else:
            await sync_to_async(cache.set)(self.group_name,new_active_user)

        message=list({user['user'] for user in new_active_user if user['user'] != self.current_user.id})
    else:
        await sync_to_async(cache.delete)(self.group_name)
        message=list()
    await self.channel_layer.group_send(self.group_name,{'type':'status.message','message':message})
    await self.channel_layer.group_discard(self.group_name,self.channel_name)
