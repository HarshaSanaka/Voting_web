import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.db import IntegrityError
from django.db.models import Count
from .models import Candidate, Vote, EligibleVoter


def normalize_student_id(student_id):
    if not isinstance(student_id, str):
        return ''
    return student_id.strip().upper()


# ─── Student Endpoints ─────────────────────────────────────────

@csrf_exempt
def login_view(request):
    """Check if a student has already voted."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    student_id = normalize_student_id(data.get('studentId', ''))

    if not student_id:
        return JsonResponse({'error': 'Student ID is required.'}, status=400)

    if not EligibleVoter.objects.filter(student_id__iexact=student_id).exists():
        return JsonResponse({'error': 'Student ID is not eligible to vote.'}, status=403)

    if Vote.objects.filter(student_id__iexact=student_id).exists():
        return JsonResponse({'error': 'You have already cast your vote.'}, status=403)

    return JsonResponse({'message': 'Login successful'})


@csrf_exempt
def vote_view(request):
    """Cast a vote for a candidate."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    student_id = normalize_student_id(data.get('studentId', ''))
    candidate_id = data.get('candidateId')

    if not student_id or candidate_id is None:
        return JsonResponse({'error': 'Student ID and Candidate are required.'}, status=400)

    if not EligibleVoter.objects.filter(student_id__iexact=student_id).exists():
        return JsonResponse({'error': 'Student ID is not eligible to vote.'}, status=403)

    try:
        candidate = Candidate.objects.get(id=candidate_id)
    except Candidate.DoesNotExist:
        return JsonResponse({'error': 'Candidate not found.'}, status=404)

    try:
        vote = Vote.objects.create(student_id=student_id, candidate=candidate)
        return JsonResponse({
            'message': 'Vote recorded successfully',
            'voteId': vote.id
        }, status=201)
    except IntegrityError:
        return JsonResponse({'error': 'This Student ID has already cast a vote.'}, status=409)


def candidates_view(request):
    """Return all available candidates."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    candidates = Candidate.objects.all().order_by('id')
    result = []
    for c in candidates:
        result.append({
            'id': c.id,
            'name': c.name,
            'department': c.department,
            'avatarCode': c.avatar_code,
        })
    return JsonResponse(result, safe=False)


# ─── Admin Endpoints ───────────────────────────────────────────

@csrf_exempt
def admin_login_view(request):
    """Authenticate admin user."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return JsonResponse({'error': 'Username and Password are required.'}, status=400)

    user = authenticate(username=username, password=password)
    if user is not None and user.is_superuser:
        return JsonResponse({'message': 'Admin login successful', 'username': user.username})
    else:
        return JsonResponse({'error': 'Invalid admin credentials.'}, status=401)


def admin_dashboard_data_view(request):
    """Return consolidated dashboard data: candidates with vote counts, total votes, vote logs."""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    # Candidates with vote counts
    candidates = Candidate.objects.annotate(vote_count=Count('votes')).order_by('id')
    total_votes = Vote.objects.count()

    candidates_data = []
    for c in candidates:
        percentage = round((c.vote_count / total_votes * 100), 1) if total_votes > 0 else 0
        candidates_data.append({
            'id': c.id,
            'name': c.name,
            'department': c.department,
            'avatarCode': c.avatar_code,
            'voteCount': c.vote_count,
            'percentage': percentage,
        })

    # Vote logs
    votes = Vote.objects.select_related('candidate').order_by('-timestamp')
    logs = []
    for v in votes:
        logs.append({
            'id': v.id,
            'studentId': v.student_id,
            'candidate': v.candidate.name,
            'timestamp': v.timestamp.isoformat(),
        })

    return JsonResponse({
        'totalVotes': total_votes,
        'totalCandidates': candidates.count(),
        'totalEligibleVoters': EligibleVoter.objects.count(),
        'candidates': candidates_data,
        'logs': logs,
    })


@csrf_exempt
def add_candidate_view(request):
    """Add a new candidate."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    name = data.get('name', '').strip()
    department = data.get('department', 'General').strip()

    if not name:
        return JsonResponse({'error': 'Candidate name is required.'}, status=400)

    try:
        candidate = Candidate.objects.create(name=name, department=department)
        return JsonResponse({
            'message': f'{name} added successfully',
            'candidate': {
                'id': candidate.id,
                'name': candidate.name,
                'department': candidate.department,
                'avatarCode': candidate.avatar_code,
            }
        }, status=201)
    except IntegrityError:
        return JsonResponse({'error': 'A candidate with that name already exists.'}, status=409)


@csrf_exempt
def eligible_voters_view(request):
    """List or add eligible student IDs."""
    if request.method == 'GET':
        voters = EligibleVoter.objects.all().order_by('student_id')
        data = [
            {
                'id': v.id,
                'studentId': v.student_id,
                'addedAt': v.added_at.isoformat(),
            }
            for v in voters
        ]
        return JsonResponse(data, safe=False)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        student_id = normalize_student_id(data.get('studentId', ''))
        if not student_id:
            return JsonResponse({'error': 'Student ID is required.'}, status=400)

        if EligibleVoter.objects.filter(student_id__iexact=student_id).exists():
            return JsonResponse({'error': 'This student ID is already eligible.'}, status=409)

        try:
            voter = EligibleVoter.objects.create(student_id=student_id)
            return JsonResponse({
                'message': f'{student_id} is now eligible to vote.',
                'voter': {
                    'id': voter.id,
                    'studentId': voter.student_id,
                    'addedAt': voter.added_at.isoformat(),
                }
            }, status=201)
        except IntegrityError:
            return JsonResponse({'error': 'This student ID is already eligible.'}, status=409)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def delete_eligible_voter_view(request, voter_id):
    """Remove an eligible student ID."""
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        voter = EligibleVoter.objects.get(id=voter_id)
        voter.delete()
        return JsonResponse({'message': 'Eligible student removed successfully'})
    except EligibleVoter.DoesNotExist:
        return JsonResponse({'error': 'Eligible student not found.'}, status=404)


@csrf_exempt
def delete_candidate_view(request, candidate_id):
    """Delete a candidate by ID."""
    if request.method != 'DELETE':
        return JsonResponse({'error': 'Method not allowed'}, status=405)

    try:
        candidate = Candidate.objects.get(id=candidate_id)
        candidate.delete()
        return JsonResponse({'message': 'Candidate deleted successfully'})
    except Candidate.DoesNotExist:
        return JsonResponse({'error': 'Candidate not found.'}, status=404)
