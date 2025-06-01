from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def home(request):
    """Home page API view"""
    return JsonResponse({
        'success': True,
        'message': 'Welcome to Qwait API'
    })
