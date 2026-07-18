from django.urls import path
from . import views

urlpatterns = [
    # Student endpoints
    path('login', views.login_view, name='login'),
    path('vote', views.vote_view, name='vote'),
    path('candidates', views.candidates_view, name='candidates'),

    # Admin endpoints
    path('admin/login', views.admin_login_view, name='admin-login'),
    path('admin/dashboard-data', views.admin_dashboard_data_view, name='admin-dashboard-data'),
    path('admin/candidates', views.add_candidate_view, name='add-candidate'),
    path('admin/candidates/<int:candidate_id>', views.delete_candidate_view, name='delete-candidate'),
    path('admin/eligible-voters', views.eligible_voters_view, name='eligible-voters'),
    path('admin/eligible-voters/<int:voter_id>', views.delete_eligible_voter_view, name='delete-eligible-voter'),
]
