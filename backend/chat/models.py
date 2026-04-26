from django.db import models
from django.db.models import Q
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractBaseUser,PermissionsMixin
from cloudinary.models import CloudinaryField
from django.core.validators import FileExtensionValidator
# Create your models here.

class CustomUserManager(BaseUserManager):
    use_in_migrations=True

    def create_user(self,email=None,password=None,phone=None,**extra_fields):
        if email is None and phone is None:
            raise ValueError('Error:email and phone cannot be null')
        if email:
            email=self.normalize_email(email)
            user=self.model(email=email,**extra_fields)
        else:
            user=self.model(phone=phone,**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self,email,password,phone=None,**extra_fields):
        extra_fields.setdefault('is_staff',True)
        extra_fields.setdefault('is_superuser',True)

        if not extra_fields.get('is_staff'):
            raise ValueError('superuser must have is_staff =True')
        if not extra_fields.get('is_superuser'):
            raise ValueError('superuser must have is_superuser = True')
        
        return self.create_user(email,phone,password,**extra_fields)
    


class User(AbstractBaseUser,PermissionsMixin):
    username=models.CharField(max_length=200,unique=True)
    email=models.EmailField(null=True,blank=True)
    first_name=models.CharField(max_length=200)
    last_name=models.CharField(max_length=200)
    phone=models.CharField(max_length=200,null=True,blank=True)
    profile_picture=CloudinaryField('profile_picture',null=True,blank=True,folder='profile_pictures')
    # profile_picture=models.ImageField(upload_to='profile_picture/',null=True,blank=True)
    profile_bg_picture=CloudinaryField('bg-pictures',null=True,blank=True,folder='bg-pictures')
    # profile_bg_picture=models.ImageField(upload_to='bg_pictures/',null=True,blank=True)
    bio=models.CharField(max_length=500,null=True,blank=True)
    last_seen=models.DateTimeField(auto_now=True)
    is_online=models.BooleanField(default=False)
    is_staff=models.BooleanField(default=False)
    date_joined=models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD='username'
    REQUIRED_FIELDS=['email']

    objects=CustomUserManager()


    def __str__(self):
        return self.username
    
    class Meta:
        db_table='usermodel'
        indexes=[
            models.Index(fields=['username']),
            models.Index(fields=['first_name']),
            models.Index(fields=['last_name'])
        ]


class Conversation(models.Model):
    chat_type=models.CharField(max_length=200,choices=[('group','Group'),('direct','Direct')],null=True,blank=True)
    pending_user=models.JSONField(default=list)
    name=models.CharField(max_length=300,blank=True,null=True)
    group_img=CloudinaryField('group_img',null=True,blank=True,folder='group-img')
    admin=models.ManyToManyField(User,related_name='admin')
    super_admin=models.ForeignKey(User,related_name='super_admin',on_delete=models.SET_NULL,null=True,blank=True)
    participants=models.ManyToManyField(User,related_name='conversation_paritcipant')
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        users = list(self.participants.all())

        if len(users) >= 2:
            return f'{users[0].username} chat with {users[1].username}'
        elif len(users) == 1:
            return f'{users[0].username} (waiting for another user)'
        else:
            return 'Empty conversation'
    # def __str__(self):
    #     if self.name:
    #         return self.name
    #     else:
    #         users=list(self.participants.all())
    #         print('length:',len(users))
    #         print('USERS:',users)
    #         # print(users[1],users[0])
    #         return f'{users[0].username} chat with {users[1].username}'
        
    class Meta:
        db_table='conversation'



class Message(models.Model):
    sender=models.ForeignKey(User,related_name='message',on_delete=models.CASCADE)
    content=models.TextField()
    conversation=models.ForeignKey(Conversation,related_name='conversation',on_delete=models.CASCADE)
    attachment=models.FileField(upload_to='message_attachment/',null=True,blank=True)
    attachment=CloudinaryField('attachment',null=True,blank=True,folder='message_attachment')
    # attachment_type=models.CharField(max_length=20,null=True,blank=True)
    #dev field for media remember to remove later and switch to cloudinary field
    # audio=models.FileField(upload_to='audio/',validators=[FileExtensionValidator(allowed_extensions=['mp3','wav'])],null=True,blank=True)
    # video=models.FileField(upload_to='video/',validators=[FileExtensionValidator(allowed_extensions=['mp4','wav'])],null=True,blank=True)
    # image=models.ImageField(upload_to='image_chat/',validators=[FileExtensionValidator(allowed_extensions=['jpg','jpeg','svg','png'])],null=True,blank=True)
    timestamp=models.DateTimeField(auto_now_add=True)
    is_edited=models.BooleanField(default=False)

    class Meta:
        db_table='message'
    
    def __str__(self):
        return f"{self.sender.username} sent {self.content}"
    

class MessageReciept(models.Model):
    user=models.ForeignKey(User,related_name='usermessage_reciept',on_delete=models.CASCADE)
    message=models.ForeignKey(Message,related_name='message_reciept',on_delete=models.CASCADE)
    conversation=models.ForeignKey(Conversation,related_name='mssgconversation_reciept',on_delete=models.CASCADE)
    status=models.CharField(max_length=200,choices=[('delivered','Delivered'),('read','Read'),('inactive','Inactive')])
    time_stamp=models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table='message_reciept'
        unique_together=('message','user')

    def __str__(self):
        return f"{self.user.username}-{self.message.id}-{self.status}"
    

class MessageReaction(models.Model):
    user=models.ForeignKey(User,related_name='msg_reaction',on_delete=models.CASCADE)
    message=models.ForeignKey(Message,related_name='msg_reaction',on_delete=models.CASCADE)
    conversation=models.ForeignKey(Conversation,related_name='conversation_reaction',on_delete=models.CASCADE,null=True,blank=True)
    reaction=models.CharField(max_length=50)
    created_at=models.DateTimeField(auto_now=True)

    class Meta:
        db_table='message_reaction'
        # unique_together=('user','message','reaction')
        constraints=[
            models.UniqueConstraint(
                fields=['user','message'],
                name='unique_reaction'
            )
        ]

    def __str__(self):
        return f"{self.user.username} reacted {self.reaction} to message {self.message.id}"


class Connection(models.Model):
    user_one=models.ForeignKey(User,related_name='user_one_connection',on_delete=models.CASCADE)
    user_two=models.ForeignKey(User,related_name='user_two_connection',on_delete=models.CASCADE)
    timestamp=models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table='connection'
        constraints=[
            models.UniqueConstraint(
                fields=['user_one','user_two'],
                name='unique_connections'
            )
        ]

    def __str__(self):
        return self.user_one.username

class ConnectionRequest(models.Model):
    from_user=models.ForeignKey(User,related_name='from_request',on_delete=models.CASCADE)
    to_user=models.ForeignKey(User,related_name='to_request',on_delete=models.CASCADE)
    status=models.CharField(max_length=100,default='pending')
    connection_count=models.JSONField(default=dict)
    timestamp=models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table='connection_request'
        constraints=[
            models.UniqueConstraint(
                fields=['from_user','to_user'],
                condition=Q(status='pending'),
                name='unique_request_connection'
            )
        ]

    def __str__(self):
        return f"{self.from_user.username} connection request"
    
