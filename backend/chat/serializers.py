from rest_framework import serializers,exceptions
from django.db.models import Q
from django.contrib.auth import get_user_model,authenticate
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from . models import Connection,ConnectionRequest,Message,MessageReaction,Conversation,MessageReciept

User=get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True)
    class Meta:
        model=User
        fields=['email','phone','username','password']
    def create(self,validated_data):
        if User.objects.filter(email=validated_data.get('email')).exists():
            return {'mssg':'User already exist '}
        user=User.objects.create_user(**validated_data)
        return user
    def validate(self,attrs):
        if User.objects.filter(username=attrs.get('username')).exists():
            raise serializers.ValidationError('username already taken pls chose another name')
        return attrs

class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        user=authenticate(request=self.context['request'],**attrs)
        if not user:
            raise exceptions.AuthenticationFailed('Invalid Credentials')
        refresh=self.get_token(user)
        return {'refresh':str(refresh),'access':str(refresh.access_token)}

class BasicUserSerializer(serializers.ModelSerializer):
    # connection_status=serializers.SerializerMethodField()
    class Meta:
        from django.contrib.auth import get_user_model
        User=get_user_model()
        model=User
        fields=['id','username','email','phone','profile_picture','last_seen','bio']



    # def get_connection_status(self,obj):
    #     current_user=self.context['request'].user
    #     other_user=obj
    #     connection_exist=ConnectionRequest.objects.filter(Q(from_user=current_user,to_user=other_user)|Q(from_user=other_user,to_user=current_user))
    #     if connection_exist:
    #         for connection in connection_exist:
    #             if connection.status == 'rejected':
    #                 return None
    #             return connection.status        


class UserSerializer(serializers.ModelSerializer):
    # connection_status=serializers.SerializerMethodField()
    class Meta:
        model=User 
        fields=["id","username","first_name","last_name","phone","profile_picture","profile_bg_picture","bio","last_seen","is_online","date_joined"]

    def get_connection_status(self,obj):
        current_user=self.context['request'].user
        other_user=obj
        connection_exist=ConnectionRequest.objects.filter(Q(from_user=current_user,to_user=other_user)|Q(from_user=other_user,to_user=current_user))
        if connection_exist:
            for connection in connection_exist:
                if connection.status == 'rejected':
                    return None
                return connection.status
        


class ConnectionRequestSerializer(serializers.ModelSerializer):
    to_user=serializers.PrimaryKeyRelatedField(queryset=User.objects.all(),write_only=True)
    # from_user_info=BasicUserSerializer(source='to_user',read_only=True)
    from_user_info=serializers.SerializerMethodField()
    class Meta:
        model=ConnectionRequest
        fields=['id','to_user','status','from_user_info']
        read_only_fields=['id','from_user_info']

    def get_existing_request(self,from_user,to_user):
        existing=ConnectionRequest.objects.filter(Q(from_user=from_user,to_user=to_user)|Q(to_user=from_user,from_user=to_user)).first()
        return existing

    def create(self, validated_data):
        # current_user=self.context['request'].user
        from_user=validated_data['from_user']
        to_user=validated_data.get('to_user')
        existing_request=self.get_existing_request(from_user,to_user)
        if existing_request:
            # if existing_request.from_user
            if existing_request.status == 'disconnected':
                counts=existing_request.connection_count or {}
                if existing_request.auth_user_id == from_user.id:
                    counts['auth_user_request_count']=counts.get('auth_user_request_count',0)+1
                else:
                    counts['other_auth_user_request_count']=counts.get('other_auth_user_request_count',0)+1
                existing_request.connection_count=counts
                existing_request.status='pending'
                existing_request.save(update_fields=['connection_count','status'])
                return existing_request
        
        count={'auth_user_request_count':1}
        validated_data['connection_count']=count
        return ConnectionRequest.objects.create(**validated_data)
    
    def get_from_user_info(self,obj):
        return BasicUserSerializer(obj.from_user,context=self.context).data

    def validate(self,data):
        to_user=data.get('to_user')
        current_user=self.context['request'].user
        
        ALLOWED_TRANSITIONS={
            'pending':['connected','rejected'],
            'connected':['disconnected'],
            'rejected':[],
            'disconnected':[]
                }
        
        if self.instance is None:
            if not to_user:
                raise serializers.ValidationError('Invalid request')
            existing_connection=self.get_existing_request(current_user,to_user)
            if current_user.id == to_user:
                raise serializers.ValidationError('cannot connect to self')
            if existing_connection is None:
                return data
            user_in_connection ={existing_connection.from_user_id,existing_connection.to_user_id}
            if {current_user.id,to_user} != user_in_connection:
                raise serializers.ValidationError('cannot update connection')
            if existing_connection.status in ['pending','connected']:
                raise serializers.ValidationError('Request Already Active')
            return data
        else:
            users_in_connection_update={self.instance.from_user_id,self.instance.to_user_id}
            if to_user and {current_user.id,to_user.id} != {users_in_connection_update}:
                raise serializers.ValidationError('cannot update update connection')
            if current_user.id != self.instance.to_user_id:
                raise serializers.ValidationError('cannot accept own connection request')
            current_status=self.instance.status
            new_status=data.get('status')
            if new_status not in ALLOWED_TRANSITIONS.get(current_status,[]):
                raise serializers.ValidationError('Connection may already be accepted,rejected or disconnected pls send a new request')
            return data
    
class PendingRequestSerializer(serializers.ModelSerializer):
    to_user=UserSerializer(read_only=True)
    class Meta:
        model=ConnectionRequest
        fields=['to_user']

class ConnectionSerializer(serializers.ModelSerializer):
    connections=serializers.SerializerMethodField()
    class Meta:
        model=Connection
        fields=['connections','timestamp']

    def get_connections(self,obj):
        current_user=self.context['request'].user

        if current_user == obj.user_one:
            return BasicUserSerializer(obj.user_two,context=self.context).data
        else:
             return BasicUserSerializer(obj.user_one,context=self.context).data


class MessageSerializer(serializers.ModelSerializer):
    attachment=serializers.FileField(required=False)
    # file_url=serializers.SerializerMethodField()
    
    # current_user_id=serializers.SerializerMethodField()
    status=serializers.SerializerMethodField()
    reaction=serializers.SerializerMethodField()
    class Meta:
        model=Message
        fields=['id','client_id','sender','text','is_edited','status','timestamp','attachment','attachment_type','reaction']
        read_only_fields=['sender','text','status','reaction']

    
    def create(self, validated_data):
        current_user=self.context['request'].user
        message=super().create(validated_data)
        participants=message.conversation.participants.exclude(id=current_user.id)
        for user in participants:
            MessageReciept.objects.create(message=message,conversation=message.conversation,user=user,status='delivered')
        return message
    
    def get_current_user_id(self,obj):
        current_user=self.context['request'].user
        return current_user.id
    
    def get_status(self,obj):
        reciepts=list(MessageReciept.objects.filter(message=obj,conversation=obj.conversation).values_list('status',flat=True))
        # unread_reciepts={}
        # unread_reciepts.update([reciept for reciept in reciepts])
        # return unread_reciepts
        return reciepts[0] if reciepts else None
    
    def get_reaction(self,obj):
        react= MessageReaction.objects.filter(conversation=obj.conversation,message=obj).values_list('reaction',flat=True)
        return react

class ConversaitonSerializer(serializers.ModelSerializer):
    # participants=BasicUserSerializer(many=True,read_only=True)
    # other_user_id=serializers.ListField(child=serializers.IntegerField(),write_only=True,default=list)
    pending_user=serializers.ListField(child=serializers.IntegerField(),write_only=True,default=list)
    last_msg=serializers.SerializerMethodField()
    all_participants=serializers.SerializerMethodField()
    recent_reaction=serializers.SerializerMethodField()
    unread_mssg_count=serializers.SerializerMethodField()
    # last_read_msg_id=serializers.SerializerMethodField()
    messages=serializers.SerializerMethodField()
    connection_request=serializers.SerializerMethodField()

    class Meta:
        model=Conversation
        fields=['id','all_participants','name','created_at','updated_at','chat_type','last_msg','last_interaction','unread_mssg_count','last_read_msg_id','group_img','recent_reaction','messages','pending_user','connection_request']
        read_only_fields=['participants','created_at','updated_at','last_msg','all_participants','unread_mssg_count','last_read_msg_id','last_interaction','recent_reaction','message','connection_request']

    
    def create(self, validated_data):
        current_user=self.context['request'].user
        # other_user=validated_data.pop('pending_user',None)
        if validated_data.get('_existing_conversation',None):
            return validated_data.get('_existing_conversation')
        other_members=validated_data.get('pending_user',None)
        if validated_data.get('chat_type',None) == 'group':
            validated_data.pop('pending_user',None)
        new_conversation=Conversation.objects.create(**validated_data)
        # all_user=[current_user.id,*other_user]
        new_conversation.participants.add(current_user,*other_members)
        # Message.objects.create(sender=current_user,text='New chat created.Send a message to continue...',conversation=new_conversation)
        return new_conversation
    
    def validate(self, attrs):
        ##create validation 

        current_user=self.context['request'].user
        if self.instance is None:
            # other_user=User.objects.get(pk=attrs.get('other_user_id')[0])
            if attrs.get('chat_type',None) == 'group':
                attrs['super_admin']=current_user
            if attrs.get('chat_type',None) == 'group' and attrs.get('name',None) is None:
                raise serializers.ValidationError('Group name cannot be null')
            if attrs.get('chat_type',None) == 'direct':
                if len(attrs.get('pending_user',None)) > 2:
                    raise serializers.ValidationError('direct chat cannot have more than 2 users')
                if attrs.get('pending_user',None):
                    existing_conversation=Conversation.objects.filter(chat_type='direct',participants=current_user).filter(participants=attrs['pending_user'][0]).first()
                if existing_conversation:
                    attrs['_existing_conversation']=existing_conversation
            # if not attrs.get('name',None):
            #     attrs['name']=f'{current_user.username} chat with {other_user.username} '
            return attrs
        #update validation
        if self.instance:
            if self.instance.participants.count() == 2 and self.instance.chat_tyep == 'direct':
                raise serializers.ValidationError('cannot join direct chat anymore')
            if current_user in self.instance.participants.all():
                raise serializers.ValidationError('already a member of this conversation')
            return attrs
        

    def get_connection_request(self,obj):
        current_user=self.context['request'].user
        other_user=obj.participants.all().exclude(id=current_user.id)[0]
        con=ConnectionRequest.objects.filter(Q(from_user=current_user,to_user=other_user) | Q(from_user=other_user,to_user=current_user)).first()
        if obj.chat_type == 'group':
            return None
        return ConnectionRequestSerializer(con,context=self.context).data if con else None

    # def get_last_read_msg_id(self,obj):
    #     current_user=self.context['request'].user
    #     last_stat=obj.mssgconversation_reciept.filter(status__icontains='read',user=current_user).order_by('-timestamp').first()
    #     if last_stat:
    #         print(last_stat.message.text)
    #     return last_stat.message.id if last_stat else 0

    def get_messages(self,obj):
        currentUser=self.context['request'].user
        messages=obj.conversation.all().order_by('-timestamp')[:50]
        return MessageSerializer(messages[::-1],many=True,context=self.context).data
        # return [msg for msg in messages if msg['sender'] != currentUser and msg['text'] != 'New chat created.Send a message to continue...']
        
    def get_current_user_id(self,obj):
        return self.context['request'].user.id
    def get_last_msg(self,obj):
        message=Message.objects.filter(conversation=obj).order_by('-timestamp')
        message=list(message)
        return MessageSerializer(message[0],context=self.context).data['text'] if message else None

    def get_recent_reaction(self,obj):
         current_user=self.context['request'].user
         reaction=MessageReaction.objects.filter(conversation=obj).order_by('-created_at').first()
         if reaction:
             return f"{'you' if current_user == reaction.user else reaction.user} reacted {reaction.reaction} to {reaction.message.text}"
         return None

    def get_all_participants(self,obj):
        # current_user=self.context['request'].user
        other_users=obj.participants.all()
        return BasicUserSerializer(other_users,many=True,context=self.context).data if other_users else None
    
    def get_unread_mssg_count(self,obj):
        current_user=self.context['request'].user
        count=list(MessageReciept.objects.filter(user=current_user,status='Delivered',conversation=obj))
        return len(count)
    



class MessageReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model=MessageReciept
        fields=['user','status']

class MessageReactionSerializer(serializers.ModelSerializer):
    user=serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model=MessageReaction
        fields=['id','reaction','message','user']
