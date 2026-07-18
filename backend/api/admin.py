from django.contrib import admin
from .models import Candidate, Vote, EligibleVoter, Election


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
	list_display = ("id", "name", "department", "avatar_code")
	search_fields = ("name", "department")
	ordering = ("id",)


@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
	list_display = ("id", "student_id", "candidate", "timestamp")
	search_fields = ("student_id", "candidate__name")
	list_filter = ("candidate",)


@admin.register(EligibleVoter)
class EligibleVoterAdmin(admin.ModelAdmin):
	list_display = ("id", "student_id", "added_at")
	search_fields = ("student_id",)
	ordering = ("student_id",)


@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):
	list_display = ("id","title","start_date","end_date","is_active","created_at")
	search_fields = ("title",)
	list_filter = ("is_active",)
	ordering = ("-created_at",)

