from django.conf.urls import include, url
from django.contrib.staticfiles.views import serve
from django.contrib.auth import views as auth_views
from rest_framework import routers

from . import views
from linky import settings

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'links', views.LinkViewSet, base_name='links')

urlpatterns = [
    url(r'^api/', include(router.urls)),
]

# serve /static/index.html as / for dev
if settings.DEBUG:
    urlpatterns += url(r'^$', serve, kwargs={'path': 'index.html'}),
