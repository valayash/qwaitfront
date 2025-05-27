from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from restaurant_app.models import Restaurant
from django.contrib.messages import get_messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

User = get_user_model()  # Get the custom user model

@csrf_exempt
def home(request):
    """Home page API view"""
    return JsonResponse({
        'success': True,
        'message': 'Welcome to Qwait API'
    })

@csrf_exempt
def register_view(request):
    """User registration API endpoint"""
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'message': 'Method not allowed'
        }, status=405)
    
    try:
        data = request.POST if request.POST else json.loads(request.body)
        email = data.get('email')
        restaurant_name = data.get('restaurant_name')
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        
        # Validation
        if not all([email, restaurant_name, password, confirm_password]):
            return JsonResponse({
                'success': False,
                'message': 'All fields are required'
            }, status=400)
        
        # Check if passwords match
        if password != confirm_password:
            return JsonResponse({
                'success': False,
                'message': 'Passwords do not match'
            }, status=400)
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'Email already registered'
            }, status=400)
        
        # Create user with email
        user = User.objects.create_user(
            email=email,
            password=password
        )
        
        # Create associated restaurant
        restaurant = Restaurant.objects.create(user=user, name=restaurant_name)
        
        return JsonResponse({
            'success': True,
            'message': 'Account created successfully',
            'user_id': user.id,
            'restaurant_id': restaurant.id
        }, status=201)
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Registration error: {str(e)}'
        }, status=500)

@csrf_exempt
def login_view(request):
    """User login API endpoint"""
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'message': 'Method not allowed'
        }, status=405)
    
    try:
        # Try to get data from JSON first, then form data
        if request.headers.get('Content-Type') == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.POST
        
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return JsonResponse({
                'success': False,
                'message': 'Email and password are required'
            }, status=400)
        
        # Authenticate with email
        user = authenticate(request, email=email, password=password)
        
        if user is not None:
            login(request, user)
            
            # Get restaurant information if available
            restaurant = None
            try:
                restaurant = Restaurant.objects.get(user=user)
                restaurant_data = {
                    'id': restaurant.id,
                    'name': restaurant.name
                }
            except Restaurant.DoesNotExist:
                restaurant_data = None
            
            return JsonResponse({
                'success': True,
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'email': user.email
                },
                'restaurant': restaurant_data
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid email or password'
            }, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Login error: {str(e)}'
        }, status=500)

@csrf_exempt
def logout_view(request):
    """User logout API endpoint"""
    if request.method != 'POST':
        return JsonResponse({
            'success': False, 
            'message': 'Method not allowed'
        }, status=405)
    
    logout(request)
    return JsonResponse({
        'success': True,
        'message': 'Logged out successfully'
    })
