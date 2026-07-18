from django.db import models


class Candidate(models.Model):
    name = models.CharField(max_length=150, unique=True)
    department = models.CharField(max_length=150, default='General')
    avatar_code = models.CharField(max_length=5, blank=True)

    def save(self, *args, **kwargs):
        # Auto-generate avatar initials from name
        if not self.avatar_code:
            parts = self.name.strip().split()
            self.avatar_code = ''.join([p[0].upper() for p in parts[:2]])
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Election(models.Model):
    title = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.title


class Vote(models.Model):
    student_id = models.CharField(max_length=100, unique=True)
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name='votes')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student_id} voted for {self.candidate.name}"


class EligibleVoter(models.Model):
    student_id = models.CharField(max_length=100, unique=True)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.student_id
