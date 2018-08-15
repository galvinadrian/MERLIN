from django.urls import path 
from . import views 

urlpatterns = [
    path('',views.index,name='index'), # main view 
    path('query/',views.query,name='query'),
    # path('<int:q_id>/', views.detail,name='detail'), # detailed question view
    # path('<int:q_id/results',views.results,name='results'), # results of question view
    # path('<int:q_id>/vote',views.vote,name='vote') # vote on question view 
]