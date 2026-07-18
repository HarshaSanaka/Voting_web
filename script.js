const API_BASE_URL = 'http://localhost:8000/api';

// Avatar gradient classes for dynamic candidates
const AVATAR_GRADIENTS = [
    'linear-gradient(135deg, #6366f1, #a855f7)',
    'linear-gradient(135deg, #10b981, #3b82f6)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #14b8a6, #06b6d4)',
    'linear-gradient(135deg, #f97316, #facc15)',
];

document.addEventListener('DOMContentLoaded', () => {
    // Store logged-in student ID
    let currentStudentId = null;

    // Views
    const loginView = document.getElementById('login-view');
    const votingView = document.getElementById('voting-view');
    const successView = document.getElementById('success-view');
    const adminLoginView = document.getElementById('admin-login-view');
    const adminView = document.getElementById('admin-view');

    // Forms & Elements
    const loginForm = document.getElementById('login-form');
    const votingForm = document.getElementById('voting-form');
    const loginError = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');
    const btnReturn = document.getElementById('btn-return');
    const candidatesGrid = document.getElementById('candidates-grid');

    // Admin Elements
    const btnAdminLink = document.getElementById('btn-admin-link');
    const btnAdminBack = document.getElementById('btn-admin-back');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminLoginError = document.getElementById('admin-login-error');
    const btnAdminClose = document.getElementById('btn-admin-close');
    const btnRefreshDashboard = document.getElementById('btn-refresh-dashboard');
    const addCandidateForm = document.getElementById('add-candidate-form');
    const addEligibleVoterForm = document.getElementById('add-eligible-voter-form');
    const eligibleVotersBody = document.getElementById('eligible-voters-table-body');

    // ─── View Switching ─────────────────────────────────────
    function switchView(hideView, showView) {
        hideView.style.opacity = '0';
        hideView.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            hideView.classList.remove('active');
            hideView.style.display = 'none';

            showView.style.display = 'block';
            setTimeout(() => {
                showView.classList.add('active');
            }, 50);
        }, 300);
    }

    // ─── Load Candidates Dynamically ────────────────────────
    async function loadCandidates() {
        try {
            const response = await fetch(`${API_BASE_URL}/candidates`);
            const candidates = await response.json();
            renderCandidateCards(candidates);
        } catch (err) {
            console.error('Failed to load candidates:', err);
        }
    }

    function renderCandidateCards(candidates) {
        candidatesGrid.innerHTML = '';
        candidates.forEach((c, index) => {
            const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
            const card = document.createElement('label');
            card.className = 'candidate-card';
            card.setAttribute('for', `candidate-${c.id}`);
            card.innerHTML = `
                <input type="radio" name="president" id="candidate-${c.id}" value="${c.id}" required>
                <div class="candidate-content">
                    <div class="candidate-avatar" style="background: ${gradient}">${c.avatarCode}</div>
                    <div class="candidate-info">
                        <h3>${c.name}</h3>
                        <p>${c.department}</p>
                    </div>
                    <div class="radio-custom"></div>
                </div>
            `;
            candidatesGrid.appendChild(card);
        });
    }

    // Load candidates on page load
    loadCandidates();

    // ─── Student Login ──────────────────────────────────────
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const studentId = document.getElementById('student-id').value.trim();
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        if (studentId.length < 4) {
            loginError.textContent = 'Invalid Student ID. Please enter at least 4 characters.';
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
            return;
        }

        try {
            submitBtn.textContent = 'Authenticating...';
            submitBtn.disabled = true;

            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId })
            });

            const data = await response.json();

            if (!response.ok) {
                loginError.textContent = '❌ ' + data.error;
                loginForm.classList.add('shake');
                setTimeout(() => loginForm.classList.remove('shake'), 500);
                submitBtn.textContent = 'Authenticate & Continue';
                submitBtn.disabled = false;
                return;
            }

            loginError.textContent = '';
            currentStudentId = studentId;
            votingForm.reset();
            // Reload candidates in case admin added new ones
            await loadCandidates();
            submitBtn.textContent = 'Authenticate & Continue';
            submitBtn.disabled = false;
            switchView(loginView, votingView);
        } catch (error) {
            loginError.textContent = 'Failed to connect to the server. Please ensure the backend is running.';
            console.error(error);
            submitBtn.textContent = 'Authenticate & Continue';
            submitBtn.disabled = false;
        }
    });

    // ─── Vote Submission ────────────────────────────────────
    votingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const selectedCandidate = document.querySelector('input[name="president"]:checked');
        if (!selectedCandidate) {
            alert('Please select a candidate before submitting.');
            return;
        }

        if (!currentStudentId) {
            alert('Session expired. Please login again.');
            return;
        }

        const studentId = currentStudentId;
        const candidateId = parseInt(selectedCandidate.value);
        const submitBtn = votingForm.querySelector('button[type="submit"]');

        try {
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;

            const response = await fetch(`${API_BASE_URL}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, candidateId })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(`Error: ${data.error}`);
                submitBtn.textContent = 'Submit Vote';
                submitBtn.disabled = false;
                return;
            }

            switchView(votingView, successView);
        } catch (error) {
            alert('Failed to connect to the server. Please ensure the backend is running.');
            console.error(error);
            submitBtn.textContent = 'Submit Vote';
            submitBtn.disabled = false;
        }
    });

    // ─── Navigation ─────────────────────────────────────────
    btnLogout.addEventListener('click', () => {
        currentStudentId = null;
        loginForm.reset();
        loginError.textContent = '';
        switchView(votingView, loginView);
    });

    btnReturn.addEventListener('click', () => {
        currentStudentId = null;
        loginForm.reset();
        loginError.textContent = '';
        switchView(successView, loginView);
    });

    // ─── Admin Login Flow ───────────────────────────────────
    btnAdminLink.addEventListener('click', () => {
        adminLoginForm.reset();
        adminLoginError.textContent = '';
        switchView(loginView, adminLoginView);
    });

    btnAdminBack.addEventListener('click', () => {
        switchView(adminLoginView, loginView);
    });

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('admin-username').value.trim();
        const password = document.getElementById('admin-password').value.trim();
        const submitBtn = adminLoginForm.querySelector('button[type="submit"]');

        if (!username || !password) {
            adminLoginError.textContent = 'Please enter both username and password.';
            return;
        }

        try {
            submitBtn.textContent = 'Signing In...';
            submitBtn.disabled = true;

            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                adminLoginError.textContent = data.error;
                adminLoginForm.classList.add('shake');
                setTimeout(() => adminLoginForm.classList.remove('shake'), 500);
                submitBtn.textContent = 'Sign In';
                submitBtn.disabled = false;
                return;
            }

            adminLoginError.textContent = '';
            submitBtn.textContent = 'Sign In';
            submitBtn.disabled = false;

            // Load dashboard and switch
            await loadDashboard();
            switchView(adminLoginView, adminView);
        } catch (error) {
            adminLoginError.textContent = 'Failed to connect to the server.';
            console.error(error);
            submitBtn.textContent = 'Sign In';
            submitBtn.disabled = false;
        }
    });

    btnAdminClose.addEventListener('click', () => {
        loginForm.reset();
        loginError.textContent = '';
        switchView(adminView, loginView);
    });

    // ─── Dashboard ──────────────────────────────────────────

    // Tab switching
    document.querySelectorAll('.tab-link').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-link').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    async function loadDashboard() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard-data`);
            const data = await response.json();
            renderDashboard(data);
            await loadEligibleVoters();
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        }
    }

    function renderDashboard(data) {
        // Stats
        animateCounter('stat-total-votes', data.totalVotes);
        animateCounter('stat-total-candidates', data.totalCandidates);
        animateCounter('stat-total-eligible', data.totalEligibleVoters || 0);

        // Live Results
        const resultsList = document.getElementById('results-list');
        resultsList.innerHTML = '';
        data.candidates.forEach((c, index) => {
            const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
            const item = document.createElement('div');
            item.className = 'result-item';
            item.innerHTML = `
                <div class="result-header">
                    <div class="result-candidate">
                        <div class="candidate-avatar-sm" style="background: ${gradient}">${c.avatarCode}</div>
                        <div>
                            <strong>${c.name}</strong>
                            <span class="result-dept">${c.department}</span>
                        </div>
                    </div>
                    <div class="result-stats">
                        <span class="result-count">${c.voteCount} vote${c.voteCount !== 1 ? 's' : ''}</span>
                        <span class="result-pct">${c.percentage}%</span>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: 0%; background: ${gradient}" data-width="${c.percentage}%"></div>
                </div>
            `;
            resultsList.appendChild(item);
        });

        // Animate progress bars
        setTimeout(() => {
            document.querySelectorAll('.progress-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        }, 100);

        // Candidates table
        const candidatesBody = document.getElementById('candidates-table-body');
        candidatesBody.innerHTML = '';
        data.candidates.forEach(c => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${c.id}</td>
                <td>${c.name}</td>
                <td>${c.department}</td>
                <td>${c.voteCount}</td>
                <td><button class="btn-delete" data-id="${c.id}">Delete</button></td>
            `;
            candidatesBody.appendChild(row);
        });

        // Bind delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (!confirm('Are you sure you want to delete this candidate? All their votes will also be deleted.')) return;
                try {
                    const res = await fetch(`${API_BASE_URL}/admin/candidates/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        await loadDashboard();
                        await loadCandidates();
                    } else {
                        const d = await res.json();
                        alert(d.error);
                    }
                } catch (err) {
                    alert('Failed to delete candidate.');
                }
            });
        });

        // Audit Logs
        const logsBody = document.getElementById('admin-table-body');
        logsBody.innerHTML = '';
        if (data.logs.length === 0) {
            logsBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-secondary);">No votes have been cast yet.</td></tr>';
        } else {
            data.logs.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${log.id}</td>
                    <td>${log.studentId}</td>
                    <td>${log.candidate}</td>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                `;
                logsBody.appendChild(row);
            });
        }
    }

    async function loadEligibleVoters() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/eligible-voters`);
            const voters = await response.json();
            renderEligibleVoters(voters);
        } catch (err) {
            console.error('Failed to load eligible voters:', err);
        }
    }

    function renderEligibleVoters(voters) {
        eligibleVotersBody.innerHTML = '';
        if (!voters || voters.length === 0) {
            eligibleVotersBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-secondary);">No eligible student IDs configured yet.</td></tr>';
            return;
        }

        voters.forEach(voter => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${voter.id}</td>
                <td>${voter.studentId}</td>
                <td><button class="btn-delete eligible-delete" data-id="${voter.id}">Remove</button></td>
            `;
            eligibleVotersBody.appendChild(row);
        });

        document.querySelectorAll('.eligible-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (!confirm('Remove this eligible student ID?')) return;
                try {
                    const res = await fetch(`${API_BASE_URL}/admin/eligible-voters/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        await loadEligibleVoters();
                        await loadDashboard();
                    } else {
                        const d = await res.json();
                        alert(d.error);
                    }
                } catch (err) {
                    alert('Failed to remove eligible student.');
                }
            });
        });
    }

    function animateCounter(elementId, target) {
        const el = document.getElementById(elementId);
        const duration = 600;
        const start = parseInt(el.textContent) || 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    // Refresh dashboard
    btnRefreshDashboard.addEventListener('click', async () => {
        btnRefreshDashboard.textContent = 'Refreshing...';
        await loadDashboard();
        btnRefreshDashboard.textContent = 'Refresh Data';
    });

    // ─── Add Candidate ──────────────────────────────────────
    addCandidateForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('new-candidate-name').value.trim();
        const department = document.getElementById('new-candidate-dept').value.trim() || 'General';

        if (!name) return;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/candidates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, department })
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error);
                return;
            }

            addCandidateForm.reset();
            await loadDashboard();
            await loadCandidates();
        } catch (err) {
            alert('Failed to add candidate.');
        }
    });

    addEligibleVoterForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const studentId = document.getElementById('new-eligible-student-id').value.trim();
        if (!studentId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/eligible-voters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId })
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error);
                return;
            }

            addEligibleVoterForm.reset();
            await loadEligibleVoters();
            await loadDashboard();
        } catch (err) {
            alert('Failed to add eligible student ID.');
        }
    });
});

// Add dynamic CSS for shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    .shake {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
`;
document.head.appendChild(style);
