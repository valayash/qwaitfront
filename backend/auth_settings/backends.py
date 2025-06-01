from django.contrib.auth.backends import ModelBackend
# from django.contrib.auth import get_user_model # Not strictly needed if importing directly
# from .models import CustomUser # Old import within restaurant_app, CustomUser is now in auth_settings.models
from .models import CustomUser # CustomUser is in the same app (auth_settings)

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        # UserModel = get_user_model() # Not needed as CustomUser is imported directly
        try:
            user = CustomUser.objects.get(email=username)
        except CustomUser.DoesNotExist:
            return None
        else:
            if user.check_password(password):
                return user
        return None 