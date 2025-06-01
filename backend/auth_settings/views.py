from django.contrib.auth import authenticate, login, logout, get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Restaurant # For creating restaurant during registration

User = get_user_model()

@method_decorator(csrf_exempt, name='dispatch') # Apply csrf_exempt to the class
class RegisterAPIView(APIView):
    permission_classes = [AllowAny] # Anyone can attempt to register

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        restaurant_name = request.data.get('restaurant_name')
        
        if not email or not password or not restaurant_name:
            return Response({'error': 'Email, password, and restaurant name are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already in use.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.create_user(email=email, password=password, first_name=first_name, last_name=last_name)
            restaurant = Restaurant.objects.create(user=user, name=restaurant_name)
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email,
                'restaurant_id': restaurant.id,
                'restaurant_name': restaurant.name
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error during user registration or restaurant creation: {str(e)}")
            if 'user' in locals() and user.id:
                User.objects.filter(id=user.id).delete()
            return Response({'error': f'Registration failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class LoginAPIView(APIView):
    permission_classes = [AllowAny] # Anyone can attempt to log in

    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not all([email, password]):
            return Response({
                'success': False,
                'message': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(request, username=email, password=password)
        
        if user:
            login(request, user) # Still useful for session management if needed by other parts of Django
            token, created = Token.objects.get_or_create(user=user)
            restaurant_details = {}
            try:
                if hasattr(user, 'restaurant_profile') and user.restaurant_profile:
                    restaurant_details = {
                        'restaurant_id': user.restaurant_profile.id,
                        'restaurant_name': user.restaurant_profile.name
                    }
            except Restaurant.DoesNotExist:
                pass
            except AttributeError:
                pass
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email
                },
                **restaurant_details
            })
        else:
            return Response({
                'success': False,
                'message': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)

@method_decorator(csrf_exempt, name='dispatch') # CSRF usually not an issue for token-based API logout
class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated] # Only authenticated users can log out

    def post(self, request, *args, **kwargs):
        try:
            # Delete the token to force a new login
            request.user.auth_token.delete()
        except (AttributeError, Token.DoesNotExist):
            # User might not have a token if logged in via session and never used token auth,
            # or token already deleted. Silently pass or log if needed.
            pass 
        
        logout(request) # Clear the session as well
        
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)
